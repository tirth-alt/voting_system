import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Config from '@/models/Config';

/**
 * POST /api/pin/validate
 * Validates if the entered PIN matches the current active PIN
 */
export async function POST(request) {
    try {
        const { pin } = await request.json();

        // Basic format validation - 4 digits
        if (!pin || !/^\d{4}$/.test(pin)) {
            return NextResponse.json({
                valid: false,
                error: 'PIN must be exactly 4 digits'
            }, { status: 400 });
        }

        // Connect to database
        await connectDB();

        // Fetch current PIN from Config
        const config = await Config.findOne({ isConfig: true });

        if (!config) {
            return NextResponse.json({
                valid: false,
                error: 'System not initialized. Please contact admin.'
            }, { status: 503 });
        }

        // Check if voting is open
        if (!config.votingOpen) {
            return NextResponse.json({
                valid: false,
                error: 'Voting is currently closed.'
            }, { status: 403 });
        }

        // Check if PIN matches current PIN
        if (pin !== config.currentPin) {
            const maskedPin = '**' + pin.slice(-2);
            console.log(`[PIN] Invalid attempt: ${maskedPin}`);
            return NextResponse.json({
                valid: false,
                error: 'Incorrect PIN. Please ask the council member for the current PIN.'
            }, { status: 401 });
        }

        // Check if PIN has already been used
        if (config.pinUsed) {
            return NextResponse.json({
                valid: false,
                error: 'This PIN has already been used. Please ask for a new PIN.'
            }, { status: 401 });
        }

        // PIN is valid and unused
        return NextResponse.json({
            valid: true
        });

    } catch (error) {
        console.error('PIN validation error:', error);
        return NextResponse.json({
            valid: false,
            error: 'Failed to validate PIN'
        }, { status: 500 });
    }
}
