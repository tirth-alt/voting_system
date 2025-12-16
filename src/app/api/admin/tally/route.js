import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { requireDean } from '@/lib/adminAuth';

/**
 * GET /api/admin/tally
 * Get election results with optional filters
 */
export async function GET(request) {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const position = searchParams.get('position');
        const house = searchParams.get('house');

        // Build query filter
        const filter = {};
        if (position) filter.positionId = position;
        if (house) filter.house = house;

        // Tie-break sorting: total_points desc, pref1_count desc, pref2_count desc, _id asc
        const candidates = await Candidate.find(filter).sort({
            total_points: -1,
            pref1_count: -1,
            pref2_count: -1,
            _id: 1
        });

        // Get all unique positions for filter dropdown
        const positions = await Candidate.distinct('positionId');
        const houses = ['leo', 'phoenix', 'tusker', 'kong'];

        return NextResponse.json({
            candidates,
            positions,
            houses,
            totalCandidates: candidates.length
        });

    } catch (error) {
        console.error('Tally error:', error);
        return NextResponse.json({ error: 'Failed to fetch tally' }, { status: 500 });
    }
}
