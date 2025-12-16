import { NextResponse } from 'next/server';
import { getAdminSession, getOAuthSession } from '@/lib/adminAuth';

/**
 * GET /api/admin/check-auth
 * Check if current session is authenticated (supports both OAuth and traditional)
 */
export async function GET() {
    // Check OAuth first (Dean or Commission)
    const oauthSession = await getOAuthSession();
    if (oauthSession?.user) {
        return NextResponse.json({
            authenticated: true,
            email: oauthSession.user.email,
            name: oauthSession.user.name,
            role: oauthSession.user.role,  // 'dean' or 'commission' from session
            authMethod: 'oauth'
        });
    }

    // Fallback to traditional session (Election Commission)
    const session = await getAdminSession();
    if (session && session.authenticated) {
        return NextResponse.json({
            authenticated: true,
            email: session.email,
            role: 'commission',
            authMethod: 'traditional'
        });
    }

    return NextResponse.json({ authenticated: false });
}
