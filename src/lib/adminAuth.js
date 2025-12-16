import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get OAuth session (Google Sign-In for Dean)
 */
export async function getOAuthSession() {
    try {
        const session = await getServerSession(authOptions);
        return session;
    } catch (error) {
        console.error('OAuth session error:', error);
        return null;
    }
}

/**
 * Check if the user is authenticated as admin (traditional login)
 * Returns the session data if authenticated, null otherwise
 */
export async function getAdminSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
        return null;
    }

    try {
        // In a production app, you'd verify the session token here
        // For now, we'll use a simple JSON parse
        const session = JSON.parse(sessionCookie.value);
        return session;
    } catch (error) {
        return null;
    }
}

/**
 * Require admin authentication (traditional login for Election Commission)
 * Returns error response if not authenticated
 */
export async function requireAdmin() {
    const session = await getAdminSession();

    if (!session || !session.authenticated) {
        return {
            authenticated: false,
            error: 'Unauthorized - Admin access required'
        };
    }

    return {
        authenticated: true,
        session,
        role: 'commission'
    };
}

/**
 * Require Dean authentication (Google OAuth or traditional admin)
 * Dean has full access to results
 */
export async function requireDean() {
    // First check OAuth (preferred for Dean)
    const oauthSession = await getOAuthSession();
    if (oauthSession?.user?.role === 'dean') {
        return {
            authenticated: true,
            user: oauthSession.user,
            role: 'dean',
            authMethod: 'oauth'
        };
    }

    // Fallback to traditional admin (for backward compatibility)
    const adminSession = await getAdminSession();
    if (adminSession?.authenticated) {
        return {
            authenticated: true,
            session: adminSession,
            role: 'dean',  // Traditional admin gets dean privileges
            authMethod: 'traditional'
        };
    }

    return {
        authenticated: false,
        error: 'Unauthorized - Dean access required'
    };
}

/**
 * Require Election Commission authentication (OAuth or traditional login)
 * Both Dean and Commission can access commission-level endpoints
 */
export async function requireCommission() {
    // Check OAuth first (both Dean and Commission can use OAuth)
    const oauthSession = await getOAuthSession();
    if (oauthSession?.user?.role) {
        // Accept both 'dean' and 'commission' roles from OAuth
        return {
            authenticated: true,
            user: oauthSession.user,
            role: oauthSession.user.role,
            authMethod: 'oauth'
        };
    }

    // Check traditional admin
    const adminSession = await getAdminSession();
    if (adminSession?.authenticated) {
        return {
            authenticated: true,
            session: adminSession,
            role: 'commission',
            authMethod: 'traditional'
        };
    }

    return {
        authenticated: false,
        error: 'Unauthorized - Commission access required'
    };
}

/**
 * Get current user's role (dean or commission)
 */
export async function getCurrentRole() {
    // Check OAuth
    const oauthSession = await getOAuthSession();
    if (oauthSession?.user?.role) {
        return oauthSession.user.role;  // Returns 'dean' or 'commission'
    }

    // Check traditional admin
    const adminSession = await getAdminSession();
    if (adminSession?.authenticated) {
        return 'commission';
    }

    return null;
}
