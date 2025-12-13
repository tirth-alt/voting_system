import { cookies } from 'next/headers';

/**
 * Check if the user is authenticated as admin
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
 * Require admin authentication
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
        session
    };
}
