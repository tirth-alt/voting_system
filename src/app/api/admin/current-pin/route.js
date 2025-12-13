import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * GET /api/admin/current-pin
 * Get the current active PIN for display on admin dashboard
 */
export async function GET() {
    try {
        const auth = await requireAdmin();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        const config = await Config.findOne({ isConfig: true });

        if (!config || !config.currentPin) {
            return NextResponse.json({
                pin: null,
                message: 'No PIN generated yet. Please initialize the system.'
            });
        }

        return NextResponse.json({
            currentPin: config.currentPin,
            pinGeneratedAt: config.pinGeneratedAt,
            pinUsed: config.pinUsed,
            votingOpen: config.votingOpen
        });

    } catch (error) {
        console.error('Get current PIN error:', error);
        return NextResponse.json({ error: 'Failed to get current PIN' }, { status: 500 });
    }
}

/**
 * POST /api/admin/current-pin
 * Manually generate a new PIN (emergency use)
 */
export async function POST() {
    try {
        const auth = await requireAdmin();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        // Generate new 4-digit PIN
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();

        await Config.findOneAndUpdate(
            { isConfig: true },
            {
                currentPin: newPin,
                pinUsed: false,
                pinGeneratedAt: new Date()
            },
            { upsert: true }
        );

        console.log(`[ADMIN] Manual PIN generation by ${auth.session.email}: **${newPin.slice(-2)}`);

        return NextResponse.json({
            success: true,
            currentPin: newPin,
            message: 'New PIN generated successfully'
        });

    } catch (error) {
        console.error('Generate PIN error:', error);
        return NextResponse.json({ error: 'Failed to generate PIN' }, { status: 500 });
    }
}
