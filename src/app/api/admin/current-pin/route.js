import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireCommission } from '@/lib/adminAuth';

// In-memory fallback when MongoDB is not available
let memoryPin = {
    currentPin: null,
    pinGeneratedAt: null,
    pinUsed: false,
    votingOpen: false  // Default closed
};

/**
 * GET /api/admin/current-pin
 * Get the current active PIN for display on admin dashboard
 */
export async function GET() {
    try {
        const auth = await requireCommission();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        try {
            await connectDB();
            const config = await Config.findOne({ isConfig: true });

            if (!config || !config.currentPin) {
                // Return memory PIN if MongoDB has no PIN
                if (memoryPin.currentPin) {
                    return NextResponse.json(memoryPin);
                }
                return NextResponse.json({
                    pin: null,
                    message: 'No PIN generated yet. Please click "Generate First PIN".'
                });
            }

            return NextResponse.json({
                currentPin: config.currentPin,
                pinGeneratedAt: config.pinGeneratedAt,
                pinUsed: config.pinUsed,
                votingOpen: config.votingOpen
            });
        } catch (dbError) {
            console.error('MongoDB error, using memory fallback:', dbError.message);
            // Return memory PIN as fallback
            if (memoryPin.currentPin) {
                return NextResponse.json({
                    ...memoryPin,
                    fallback: true,
                    message: 'Using in-memory PIN (MongoDB not connected)'
                });
            }
            return NextResponse.json({
                pin: null,
                message: 'No PIN generated yet. MongoDB not connected. Click "Generate First PIN".'
            });
        }

    } catch (error) {
        console.error('Get current PIN error:', error);
        return NextResponse.json({ error: 'Failed to get current PIN' }, { status: 500 });
    }
}

/**
 * POST /api/admin/current-pin
 * Manually generate a new PIN (emergency use or initial setup)
 */
export async function POST() {
    try {
        const auth = await requireCommission();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        // Generate new 4-digit PIN
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const now = new Date();

        try {
            await connectDB();

            await Config.findOneAndUpdate(
                { isConfig: true },
                {
                    currentPin: newPin,
                    pinUsed: false,
                    pinGeneratedAt: now
                },
                { upsert: true }
            );

            const userEmail = auth.user?.email || auth.session?.email || 'admin';
            console.log(`[ADMIN] Manual PIN generation by ${userEmail}: **${newPin.slice(-2)}`);

            return NextResponse.json({
                success: true,
                currentPin: newPin,
                pinGeneratedAt: now,
                pinUsed: false,
                message: 'New PIN generated successfully'
            });
        } catch (dbError) {
            console.error('MongoDB error, using memory fallback:', dbError.message);

            // Store in memory as fallback
            memoryPin = {
                currentPin: newPin,
                pinGeneratedAt: now,
                pinUsed: false,
                votingOpen: false  // Default closed
            };

            const userEmail = auth.user?.email || auth.session?.email || 'admin';
            console.log(`[ADMIN] Manual PIN generation (memory) by ${userEmail}: **${newPin.slice(-2)}`);

            return NextResponse.json({
                success: true,
                ...memoryPin,
                fallback: true,
                message: 'New PIN generated (in-memory, MongoDB not connected)'
            });
        }

    } catch (error) {
        console.error('Generate PIN error:', error);
        return NextResponse.json({ error: 'Failed to generate PIN' }, { status: 500 });
    }
}
