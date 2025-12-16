import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Get allowed emails from environment variables
const ALLOWED_DEAN_EMAILS = process.env.ALLOWED_DEAN_EMAILS?.split(',').map(email => email.trim()) || [];
const ALLOWED_COMMISSION_EMAILS = process.env.ALLOWED_COMMISSION_EMAILS?.split(',').map(email => email.trim()) || [];

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],

    callbacks: {
        // Control who can sign in
        async signIn({ user, account, profile }) {
            // Check if user is in either whitelist
            const isDean = ALLOWED_DEAN_EMAILS.includes(user.email);
            const isCommission = ALLOWED_COMMISSION_EMAILS.includes(user.email);
            const isAllowed = isDean || isCommission;

            if (isAllowed) {
                const role = isDean ? 'dean' : 'commission';
                console.log(`[OAUTH] Successful sign-in: ${user.email} (${role})`);
                return true;
            } else {
                console.log(`[OAUTH] Rejected sign-in attempt: ${user.email} (not in whitelist)`);
                return false;
            }
        },

        // Add custom properties to the session
        async session({ session, token }) {
            // Determine role based on email
            if (ALLOWED_DEAN_EMAILS.includes(session.user.email)) {
                session.user.role = 'dean';
            } else if (ALLOWED_COMMISSION_EMAILS.includes(session.user.email)) {
                session.user.role = 'commission';
            }
            session.user.id = token.sub;

            return session;
        },

        // Add custom properties to the JWT token
        async jwt({ token, user, account }) {
            if (user) {
                if (ALLOWED_DEAN_EMAILS.includes(user.email)) {
                    token.role = 'dean';
                } else if (ALLOWED_COMMISSION_EMAILS.includes(user.email)) {
                    token.role = 'commission';
                }
            }
            return token;
        },
    },

    pages: {
        signIn: '/admin',  // Redirect to admin page for sign-in
        error: '/admin',   // Redirect errors to admin page
    },

    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Export both GET and POST handlers
export { handler as GET, handler as POST };
