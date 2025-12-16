import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import Vote from '@/models/Vote';
import { requireCommission } from '@/lib/adminAuth';

/**
 * GET /api/admin/config
 * Get current config status (accessible by Commission and Dean)
 */
export async function GET() {
    try {
        const auth = await requireCommission();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        const config = await Config.findOne({ isConfig: true });
        const voteCount = await Vote.countDocuments();

        return NextResponse.json({
            votingOpen: config?.votingOpen ?? false,  // Default closed when no config
            totalVotes: voteCount
        });

    } catch (error) {
        console.error('Config error:', error);
        return NextResponse.json({ error: 'Failed to get config' }, { status: 500 });
    }
}
