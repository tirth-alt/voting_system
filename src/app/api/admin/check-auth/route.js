import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';

/**
 * GET /api/admin/check-auth
 * Check if current session is authenticated
 */
export async function GET() {
    const session = await getAdminSession();

    if (session && session.authenticated) {
        return NextResponse.json({
            authenticated: true,
            email: session.email
        });
    } else {
        return NextResponse.json({ authenticated: false });
    }
}
