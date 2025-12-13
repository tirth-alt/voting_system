import { NextResponse } from 'next/server';
import candidatesData from '@/data/candidates.json';

// Position metadata for frontend
const positionMeta = {
    malePresident: { title: 'Male President', type: 'preference', house: null },
    femalePresident: { title: 'Female President', type: 'preference', house: null },
    academicSecretary: { title: 'Academic Secretary', type: 'preference', house: null },
    sportsSecretary: { title: 'Sports Secretary', type: 'preference', house: null },
    culturalSecretary: { title: 'Cultural Secretary', type: 'preference', house: null },
    campusAffairsSecretary: { title: 'Campus Affairs Secretary', type: 'single', house: null },
    leoCaptain: { title: 'Leo House Captain', type: 'preference', house: 'leo' },
    phoenixCaptain: { title: 'Phoenix House Captain', type: 'preference', house: 'phoenix' },
    tuskerCaptain: { title: 'Tusker House Captain', type: 'preference', house: 'tusker' },
    kongCaptain: { title: 'Kong House Captain', type: 'preference', house: 'kong' }
};

// Add NOTA to each position
function addNotaToPositions(candidates) {
    const result = {};
    for (const [position, candidateList] of Object.entries(candidates)) {
        result[position] = [
            ...candidateList,
            {
                id: `nota_${position}`,
                name: 'NOTA',
                tagline: 'None of the Above',
                photo: null,
                isNota: true
            }
        ];
    }
    return result;
}

// Merge captain and vice-captain candidates for each house
function mergeCaptainCandidates(candidates) {
    const houses = ['leo', 'phoenix', 'tusker', 'kong'];
    const result = { ...candidates };

    for (const house of houses) {
        const captainKey = `${house}Captain`;
        const viceCaptainKey = `${house}ViceCaptain`;

        // Combine captain and vice-captain candidates (remove duplicates by id)
        const captainCandidates = candidates[captainKey] || [];
        const viceCandidates = candidates[viceCaptainKey] || [];

        // Merge all unique candidates
        const allCandidates = [...captainCandidates];
        for (const vc of viceCandidates) {
            if (!allCandidates.find(c => c.id === vc.id)) {
                allCandidates.push(vc);
            }
        }

        result[captainKey] = allCandidates;
        // Remove vice-captain key
        delete result[viceCaptainKey];
    }

    return result;
}

export async function GET() {
    try {
        // First merge captain/vice-captain candidates
        const mergedCandidates = mergeCaptainCandidates(candidatesData);
        // Then add NOTA to each position
        const candidatesWithNota = addNotaToPositions(mergedCandidates);

        return NextResponse.json({
            positions: positionMeta,
            candidates: candidatesWithNota,
            positionOrder: [
                'malePresident',
                'femalePresident',
                'academicSecretary',
                'sportsSecretary',
                'culturalSecretary',
                'campusAffairsSecretary',
                'leoCaptain',
                'phoenixCaptain',
                'tuskerCaptain',
                'kongCaptain'
            ]
        });
    } catch (error) {
        console.error('Candidates error:', error);
        return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }
}
