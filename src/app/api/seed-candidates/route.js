import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import candidatesData from '@/data/candidates.json';

/**
 * POST /api/seed-candidates
 * Seeds the database with candidates from the JSON file
 */
export async function POST() {
    try {
        await connectDB();

        // Clear existing candidates
        await Candidate.deleteMany({});

        // Map position keys to position IDs
        const positionMapping = {
            malePresident: 'malePresident',
            femalePresident: 'femalePresident',
            academicSecretary: 'academicSecretary',
            sportsSecretary: 'sportsSecretary',
            culturalSecretary: 'culturalSecretary',
            campusAffairsSecretary: 'campusAffairsSecretary',
            leoCaptain: 'leoCaptain',
            phoenixCaptain: 'phoenixCaptain',
            tuskerCaptain: 'tuskerCaptain',
            kongCaptain: 'kongCaptain'
        };

        // House mapping for captain positions
        const houseMapping = {
            leoCaptain: 'leo',
            phoenixCaptain: 'phoenix',
            tuskerCaptain: 'tusker',
            kongCaptain: 'kong'
        };

        const allCandidates = [];

        // Process each position
        for (const [key, candidates] of Object.entries(candidatesData)) {
            const positionId = positionMapping[key] || key;
            const house = houseMapping[key] || null;

            for (const candidate of candidates) {
                allCandidates.push({
                    id: candidate.id,
                    name: candidate.name,
                    positionId: positionId,
                    house: house,
                    tagline: candidate.tagline || '',
                    photo: candidate.photo || '',
                    isNota: false,
                    pref1_count: 0,
                    pref2_count: 0,
                    total_points: 0
                });
            }
        }

        // Insert all candidates
        await Candidate.insertMany(allCandidates);

        return NextResponse.json({
            success: true,
            message: `Seeded ${allCandidates.length} candidates`,
            count: allCandidates.length
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({
            error: 'Failed to seed candidates',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to seed candidates into the database',
        warning: 'This will clear existing candidates!'
    });
}
