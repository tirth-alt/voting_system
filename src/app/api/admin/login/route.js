import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/admin/login
 * Authenticate admin using environment variables (simple approach)
 */
export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Get admin credentials from environment variables and trim them
        const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
        const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

        console.log('[ADMIN LOGIN DEBUG]');
        console.log('Received email:', email);
        console.log('Expected email:', ADMIN_EMAIL);
        console.log('Email match:', email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase());
        console.log('Password match:', password === ADMIN_PASSWORD);

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
            return NextResponse.json({ error: 'Server configuration error - Admin credentials not set' }, { status: 500 });
        }

        // Simple credential check with trimming and case-insensitive email
        const emailMatch = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
        const passwordMatch = password === ADMIN_PASSWORD;

        if (!emailMatch || !passwordMatch) {
            console.log(`[ADMIN] Failed login attempt for: ${email}`);
            return NextResponse.json({
                error: 'Invalid credentials',
                debug: {
                    emailProvided: email,
                    emailExpected: ADMIN_EMAIL,
                    emailMatch,
                    passwordMatch
                }
            }, { status: 401 });
        }

        // Create session cookie
        const session = {
            email: ADMIN_EMAIL,
            authenticated: true,
            loginTime: new Date().toISOString()
        };

        const cookieStore = await cookies();
        cookieStore.set('admin_session', JSON.stringify(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        console.log(`[ADMIN] Successful login: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            email: ADMIN_EMAIL
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
