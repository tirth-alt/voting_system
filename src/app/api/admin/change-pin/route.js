import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * POST /api/admin/change-pin
 * Update the shared voting PIN (admin only)
 */
export async function POST(request) {
    try {
        const auth = await requireAdmin();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { newPin } = await request.json();

        if (!newPin || !/^\d{6}$/.test(newPin)) {
            return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
        }

        await connectDB();

        const hashedPin = await bcrypt.hash(newPin, 10);

        await Config.findOneAndUpdate(
            { isConfig: true },
            { pinHash: hashedPin },
            { upsert: true }
        );

        // Log masked PIN for audit
        const maskedPin = '***' + newPin.slice(-3);
        console.log(`[ADMIN] PIN changed to ${maskedPin} by ${auth.session.username}`);

        return NextResponse.json({
            success: true,
            message: 'PIN updated successfully'
        });

    } catch (error) {
        console.error('Change PIN error:', error);
        return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
    }
}
