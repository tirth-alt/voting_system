import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireDean } from '@/lib/adminAuth';

/**
 * POST /api/admin/toggle-voting
 * Toggle voting status (Dean-only - critical control)
 */
export async function POST(request) {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { votingOpen } = await request.json();

        if (typeof votingOpen !== 'boolean') {
            return NextResponse.json({ error: 'votingOpen must be a boolean' }, { status: 400 });
        }

        await connectDB();

        // Check if encryption is enabled before allowing voting to open
        if (votingOpen) {
            const currentConfig = await Config.findOne({ isConfig: true });
            if (!currentConfig?.encryptionEnabled) {
                return NextResponse.json({
                    error: 'Cannot open voting: Encryption must be enabled first. Set up vote encryption in Dean Actions.'
                }, { status: 400 });
            }
        }

        await Config.findOneAndUpdate(
            { isConfig: true },
            { votingOpen },
            { upsert: true }
        );

        const role = auth.role || 'dean';
        const identifier = auth.user?.email || 'admin';
        console.log(`[ADMIN] Voting ${votingOpen ? 'OPENED' : 'CLOSED'} by ${identifier} (${role})`);

        return NextResponse.json({ success: true, votingOpen });

    } catch (error) {
        console.error('Toggle voting error:', error);
        return NextResponse.json({ error: 'Failed to toggle voting status' }, { status: 500 });
    }
}
