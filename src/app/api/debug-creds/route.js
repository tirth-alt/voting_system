import { NextResponse } from 'next/server';

export async function GET() {
    // Show what the server is expecting (mask password)
    const expectedEmail = process.env.ADMIN_EMAIL;
    const hasPassword = !!process.env.ADMIN_PASSWORD;
    const passwordLength = process.env.ADMIN_PASSWORD?.length || 0;

    return NextResponse.json({
        expectedCredentials: {
            email: expectedEmail || '❌ ADMIN_EMAIL not set in ENV',
            passwordSet: hasPassword,
            passwordLength: passwordLength,
            passwordHint: hasPassword ? `${passwordLength} characters` : 'Not set'
        },
        instructions: 'Use these EXACT credentials to login'
    });
}
