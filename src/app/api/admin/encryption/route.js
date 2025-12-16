import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';
import { requireDean } from '@/lib/adminAuth';
import { encryptPassword } from '@/lib/encryption';

/**
 * GET /api/admin/encryption
 * Get encryption status
 */
export async function GET() {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();
        const config = await Config.findOne({ isConfig: true });

        return NextResponse.json({
            encryptionEnabled: config?.encryptionEnabled || false,
            encryptionEnabledAt: config?.encryptionEnabledAt || null
        });

    } catch (error) {
        console.error('Get encryption status error:', error);
        return NextResponse.json({ error: 'Failed to get encryption status' }, { status: 500 });
    }
}

/**
 * POST /api/admin/encryption
 * Enable encryption with a password (Dean only, before voting starts)
 */
export async function POST(request) {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();
        const config = await Config.findOne({ isConfig: true });

        // Check if encryption is already enabled
        if (config?.encryptionEnabled) {
            return NextResponse.json({
                error: 'Encryption is already enabled. Cannot change password.'
            }, { status: 400 });
        }

        // Check if voting has already started
        const Vote = (await import('@/models/Vote')).default;
        const voteCount = await Vote.countDocuments();
        if (voteCount > 0) {
            return NextResponse.json({
                error: 'Cannot enable encryption after votes have been cast.'
            }, { status: 400 });
        }

        const { password, confirmPassword } = await request.json();

        // Validate password
        if (!password || password.length < 8) {
            return NextResponse.json({
                error: 'Password must be at least 8 characters'
            }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({
                error: 'Passwords do not match'
            }, { status: 400 });
        }

        // Check system key exists
        if (!process.env.SYSTEM_ENCRYPTION_KEY || process.env.SYSTEM_ENCRYPTION_KEY.length < 32) {
            return NextResponse.json({
                error: 'Server encryption key not configured. Contact administrator.'
            }, { status: 500 });
        }

        // Encrypt the password
        const encryptedData = encryptPassword(password);

        // Save to config
        await Config.findOneAndUpdate(
            { isConfig: true },
            {
                encryptionEnabled: true,
                encryptedPassword: encryptedData.encrypted,
                encryptionPasswordSalt: encryptedData.salt,
                encryptionPasswordIV: encryptedData.iv,
                encryptionPasswordAuthTag: encryptedData.authTag,
                encryptionEnabledAt: new Date()
            },
            { upsert: true }
        );

        const userEmail = auth.user?.email || 'dean';
        console.log(`[ENCRYPTION] Vote encryption ENABLED by ${userEmail}`);

        return NextResponse.json({
            success: true,
            message: 'Encryption enabled successfully. All future votes will be encrypted.',
            encryptionEnabled: true,
            encryptionEnabledAt: new Date()
        });

    } catch (error) {
        console.error('Enable encryption error:', error);
        return NextResponse.json({ error: 'Failed to enable encryption' }, { status: 500 });
    }
}
