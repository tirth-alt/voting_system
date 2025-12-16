import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import Candidate from '@/models/Candidate';
import Config from '@/models/Config';
import { encrypt, decryptPassword } from '@/lib/encryption';

/**
 * Validate ballot structure
 * Only validates positions that have selections (non-null, non-empty)
 */
function validateBallot(ballot) {
    if (!ballot || typeof ballot !== 'object') {
        return { valid: false, error: 'Ballot is required' };
    }

    for (const [positionId, selection] of Object.entries(ballot)) {
        // Skip positions with no selection (user didn't vote for this position)
        if (!selection || (typeof selection === 'object' && Object.keys(selection).length === 0)) {
            continue;
        }

        // Skip if all values are null/empty
        if (!selection.pref1 && !selection.pref2 && !selection.choice) {
            continue;
        }

        // Single choice position (Campus Affairs)
        if (positionId === 'campusAffairsSecretary') {
            if (!selection.choice && !selection.pref1) {
                return { valid: false, error: `Choice required for ${positionId}` };
            }
            // Normalize: if pref1 provided, treat as choice
            if (selection.pref1 && !selection.choice) {
                ballot[positionId].choice = selection.pref1;
            }
        } else {
            // Preference positions - pref1 is required if this position has any selection
            if (!selection.pref1) {
                return { valid: false, error: `Preference 1 required for ${positionId}` };
            }

            // pref2 is optional but if provided, can't be same as pref1
            if (selection.pref2 && selection.pref1 === selection.pref2) {
                return { valid: false, error: `Cannot select same candidate for both preferences in ${positionId}` };
            }
        }
    }

    return { valid: true };
}

/**
 * POST /api/vote
 * Submit a vote with shared PIN verification
 */
export async function POST(request) {
    try {
        const { pin, ballot, house } = await request.json();

        // 1. Validate PIN format - 4 digits
        if (!pin || !/^\d{4}$/.test(pin)) {
            return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
        }

        // 2. Connect to database
        await connectDB();

        // 3. Verify PIN against Config
        const config = await Config.findOne({ isConfig: true });

        if (!config) {
            return NextResponse.json({ error: 'System not initialized' }, { status: 503 });
        }

        if (!config.votingOpen) {
            return NextResponse.json({ error: 'Voting is currently closed' }, { status: 403 });
        }

        // Check if PIN matches current PIN
        if (pin !== config.currentPin) {
            const maskedPin = '**' + pin.slice(-2);
            console.log(`[VOTE] Invalid PIN attempt: ${maskedPin}`);
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
        }

        // Check if PIN has already been used
        if (config.pinUsed) {
            return NextResponse.json({ error: 'This PIN has already been used' }, { status: 401 });
        }

        // 4. Validate ballot structure
        const ballotValidation = validateBallot(ballot);
        if (!ballotValidation.valid) {
            return NextResponse.json({ error: ballotValidation.error }, { status: 400 });
        }

        // 5. ENCRYPTION IS MANDATORY - Check if encryption is enabled
        if (!config.encryptionEnabled || !config.encryptedPassword) {
            console.error('[VOTE] Voting attempted without encryption enabled');
            return NextResponse.json({
                error: 'Voting requires encryption to be enabled. Please contact the Dean to set up vote encryption first.'
            }, { status: 400 });
        }

        // 6. Create encrypted Vote record
        let voteData;
        try {
            const encryptedPasswordData = {
                encrypted: config.encryptedPassword,
                salt: config.encryptionPasswordSalt,
                iv: config.encryptionPasswordIV,
                authTag: config.encryptionPasswordAuthTag
            };
            const deanPassword = decryptPassword(encryptedPasswordData);

            // Encrypt the ballot
            const encryptedBallot = encrypt(ballot, deanPassword);

            // SECURITY: Do NOT store any readable vote data
            voteData = {
                house: house || 'unknown',
                encryptedBallot: encryptedBallot.encrypted,
                encryptionSalt: encryptedBallot.salt,
                encryptionIV: encryptedBallot.iv,
                encryptionAuthTag: encryptedBallot.authTag,
                isEncrypted: true
            };

            console.log(`[VOTE] Encrypted vote recorded for house: ${house}`);
        } catch (err) {
            console.error('[VOTE] Encryption failed:', err.message);
            return NextResponse.json({ error: 'Vote encryption failed' }, { status: 500 });
        }

        const newVote = new Vote(voteData);
        await newVote.save();

        // 7. Update Candidate counts using bulkWrite (atomic per-operation)
        const bulkOps = [];

        for (const [positionId, selection] of Object.entries(ballot)) {
            if (positionId === 'campusAffairsSecretary') {
                const id = selection.choice || selection.pref1;
                if (id) {
                    bulkOps.push({
                        updateOne: {
                            filter: { id },
                            update: { $inc: { pref1_count: 1, total_points: 1 } }
                        }
                    });
                }
            } else {
                if (selection.pref1) {
                    bulkOps.push({
                        updateOne: {
                            filter: { id: selection.pref1 },
                            update: { $inc: { pref1_count: 1, total_points: 2 } }
                        }
                    });
                }
                if (selection.pref2) {
                    bulkOps.push({
                        updateOne: {
                            filter: { id: selection.pref2 },
                            update: { $inc: { pref2_count: 1, total_points: 1 } }
                        }
                    });
                }
            }
        }

        if (bulkOps.length > 0) {
            await Candidate.bulkWrite(bulkOps);
        }

        // 8. Mark current PIN as used and generate new PIN automatically
        const newPin = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit PIN

        await Config.findOneAndUpdate(
            { isConfig: true },
            {
                currentPin: newPin,  // Set new PIN
                pinUsed: false,  // New PIN is unused
                pinGeneratedAt: new Date()
            }
        );

        console.log(`[VOTE] Vote recorded for house: ${house}`);
        console.log(`[PIN] New PIN generated: **${newPin.slice(-2)} (auto-generated after vote)`);

        return NextResponse.json({
            success: true,
            message: 'Vote recorded successfully'
        });

    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }
}
