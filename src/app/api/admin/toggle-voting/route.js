import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * POST /api/admin/toggle-voting
 * Enable or disable voting
 */
export async function POST(request) {
    try {
        const auth = await requireAdmin();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { votingOpen } = await request.json();

        if (typeof votingOpen !== 'boolean') {
            return NextResponse.json({ error: 'votingOpen must be a boolean' }, { status: 400 });
        }

        await connectDB();

        await Config.findOneAndUpdate(
            { isConfig: true },
            { votingOpen },
            { upsert: true }
        );

        console.log(`[ADMIN] Voting ${votingOpen ? 'OPENED' : 'CLOSED'} by ${auth.session.username}`);

        return NextResponse.json({ success: true, votingOpen });

    } catch (error) {
        console.error('Toggle voting error:', error);
        return NextResponse.json({ error: 'Failed to toggle voting status' }, { status: 500 });
    }
}
