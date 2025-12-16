import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import Vote from '@/models/Vote';
import Config from '@/models/Config';
import { requireDean } from '@/lib/adminAuth';

/**
 * POST /api/admin/reset-all
 * Reset all votes, configs, and candidate counts (Dean-only - destructive action)
 */
export async function POST(request) {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { confirmCode } = await request.json();

        // Require exact confirmation code
        if (confirmCode !== 'RESET') {
            return NextResponse.json({
                error: 'Invalid confirmation code. Type RESET to confirm.'
            }, { status: 400 });
        }

        await connectDB();

        // Delete all votes
        const deleteVotesResult = await Vote.deleteMany({});

        // Delete all configs (resets encryption, voting status, PIN, etc.)
        const deleteConfigsResult = await Config.deleteMany({});

        // Reset all candidate counts to zero
        await Candidate.updateMany({}, {
            $set: {
                pref1_count: 0,
                pref2_count: 0,
                total_points: 0
            }
        });

        const identifier = auth.user?.email || auth.session?.email || 'dean';
        console.log(`[ADMIN] ⚠️ FULL ELECTION RESET by ${identifier}. Deleted ${deleteVotesResult.deletedCount} votes, ${deleteConfigsResult.deletedCount} configs.`);

        return NextResponse.json({
            success: true,
            message: `Full reset complete. Deleted ${deleteVotesResult.deletedCount} votes, ${deleteConfigsResult.deletedCount} configs. Candidate counts reset to zero.`,
            deletedVotes: deleteVotesResult.deletedCount,
            deletedConfigs: deleteConfigsResult.deletedCount
        });

    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: 'Failed to reset votes' }, { status: 500 });
    }
}
