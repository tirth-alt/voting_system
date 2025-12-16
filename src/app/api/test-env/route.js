import { NextResponse } from 'next/server';

export async function GET() {
    const envCheck = {
        boothPins: {
            booth1: process.env.NEXT_PUBLIC_BOOTH_1_PIN || '❌ NOT SET',
            booth2: process.env.NEXT_PUBLIC_BOOTH_2_PIN || '❌ NOT SET',
            booth3: process.env.NEXT_PUBLIC_BOOTH_3_PIN || '❌ NOT SET',
            booth4: process.env.NEXT_PUBLIC_BOOTH_4_PIN || '❌ NOT SET',
        },
        admin: {
            email: process.env.ADMIN_EMAIL || '❌ NOT SET',
            passwordSet: !!process.env.ADMIN_PASSWORD,
        },
        mongodb: {
            uriSet: !!process.env.MONGODB_URI,
        },
        nodeEnv: process.env.NODE_ENV || '❌ NOT SET',
    };

    return NextResponse.json(envCheck, { status: 200 });
}
