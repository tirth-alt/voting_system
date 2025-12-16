import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import Vote from '@/models/Vote';
import candidatesData from '@/data/candidates.json';
import { requireDean } from '@/lib/adminAuth';
import { decrypt, verifyPassword } from '@/lib/encryption';

/**
 * POST /api/admin/decrypt-results
 * Decrypt and view election results (Dean only, requires password)
 */
export async function POST(request) {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        await connectDB();
        const config = await Config.findOne({ isConfig: true });

        if (!config?.encryptionEnabled) {
            return NextResponse.json({
                error: 'Encryption is not enabled',
                encryptionEnabled: false
            }, { status: 400 });
        }

        // Verify password
        const encryptedData = {
            encrypted: config.encryptedPassword,
            salt: config.encryptionPasswordSalt,
            iv: config.encryptionPasswordIV,
            authTag: config.encryptionPasswordAuthTag
        };

        const isValid = verifyPassword(password, encryptedData);
        if (!isValid) {
            const userEmail = auth.user?.email || 'dean';
            console.log(`[ENCRYPTION] Invalid decryption password attempt by ${userEmail}`);
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Decrypt all votes and tally
        const votes = await Vote.find({});

        // Create candidate lookup from static data (same source as voting page)
        const candidateLookup = {};
        const houseFromPosition = {
            'leoCaptain': 'leo',
            'phoenixCaptain': 'phoenix',
            'tuskerCaptain': 'tusker',
            'kongCaptain': 'kong'
        };

        for (const [positionId, positionCandidates] of Object.entries(candidatesData)) {
            for (const candidate of positionCandidates) {
                candidateLookup[candidate.id] = {
                    ...candidate,
                    positionId: positionId,
                    house: houseFromPosition[positionId] || null
                };
            }
            // Add NOTA for each position
            const notaId = `nota_${positionId}`;
            candidateLookup[notaId] = {
                id: notaId,
                name: 'NOTA',
                positionId: positionId,
                isNota: true,
                house: houseFromPosition[positionId] || null
            };
        }

        // Tally results
        const results = {};
        let decryptedCount = 0;
        let errorCount = 0;

        for (const vote of votes) {
            try {
                const ballot = decrypt({
                    encrypted: vote.encryptedBallot,
                    salt: vote.encryptionSalt,
                    iv: vote.encryptionIV,
                    authTag: vote.encryptionAuthTag
                }, password);
                decryptedCount++;

                // Tally the vote
                for (const [position, choices] of Object.entries(ballot)) {
                    // Map 'houseCaptain' to the actual house-specific position
                    let actualPosition = position;
                    if (position === 'houseCaptain' && vote.house) {
                        actualPosition = `${vote.house}Captain`;
                    }

                    if (!results[actualPosition]) {
                        results[actualPosition] = {};
                    }

                    const pref1Id = choices.pref1 || choices.choice;
                    const pref2Id = choices.pref2;

                    if (pref1Id) {
                        if (!results[actualPosition][pref1Id]) {
                            results[actualPosition][pref1Id] = { pref1: 0, pref2: 0, total: 0 };
                        }
                        results[actualPosition][pref1Id].pref1++;
                        results[actualPosition][pref1Id].total += choices.choice ? 1 : 2;
                    }

                    if (pref2Id) {
                        if (!results[actualPosition][pref2Id]) {
                            results[actualPosition][pref2Id] = { pref1: 0, pref2: 0, total: 0 };
                        }
                        results[actualPosition][pref2Id].pref2++;
                        results[actualPosition][pref2Id].total += 1;
                    }
                }
            } catch (err) {
                console.error('Failed to decrypt vote:', err.message);
                errorCount++;
            }
        }

        // Format results with candidate names
        const formattedResults = [];
        for (const [position, candidatesInPosition] of Object.entries(results)) {
            const positionResults = [];
            for (const [candidateId, scores] of Object.entries(candidatesInPosition)) {
                const candidate = candidateLookup[candidateId];
                positionResults.push({
                    candidateId,
                    name: candidate?.name || candidateId,
                    house: candidate?.house || null,
                    position,
                    positionId: position,
                    pref1_count: scores.pref1,
                    pref2_count: scores.pref2,
                    total_points: scores.total
                });
            }
            positionResults.sort((a, b) => b.total_points - a.total_points);
            formattedResults.push(...positionResults);
        }

        const userEmail = auth.user?.email || 'dean';
        console.log(`[ENCRYPTION] Results decrypted by ${userEmail}. ${decryptedCount} votes decrypted, ${errorCount} errors.`);

        return NextResponse.json({
            success: true,
            results: formattedResults,
            totalVotes: votes.length,
            decryptedVotes: decryptedCount,
            errorCount,
            decryptedAt: new Date()
        });

    } catch (error) {
        console.error('Decrypt results error:', error);
        return NextResponse.json({ error: 'Failed to decrypt results' }, { status: 500 });
    }
}
