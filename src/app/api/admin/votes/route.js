import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import { requireCommission } from '@/lib/adminAuth';

/**
 * GET /api/admin/votes
 * Get vote statistics (accessible by Commission and Dean)
 */
export async function GET() {
    try {
        const auth = await requireCommission();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        const totalVotes = await Vote.countDocuments();

        // Votes by house
        const votesByHouse = await Vote.aggregate([
            { $group: { _id: '$house', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent votes (last 10)
        const recentVotes = await Vote.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .select('house timestamp');

        return NextResponse.json({
            totalVotes,
            votesByHouse,
            recentVotes
        });

    } catch (error) {
        console.error('Votes stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch vote stats' }, { status: 500 });
    }
}
