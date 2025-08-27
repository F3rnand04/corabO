'use server';

import { signInAsGuestFlow } from '@/ai/flows/auth-flow';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

/**
 * Securely signs in a user as a guest by generating a custom token on the server.
 */
export async function signInAsGuest(): Promise<{ customToken?: string; error?: string }> {
    try {
        const { customToken } = await signInAsGuestFlow();
        return { customToken };
    } catch (error: any) {
        console.error('[ACTION_ERROR] signInAsGuest:', error);
        return { error: 'Failed to sign in as guest.' };
    }
}


/**
 * Creates a session cookie from the client's ID token.
 */
export async function createSessionCookie(idToken: string) {
    const auth = getAuth();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax' });
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
    cookies().delete('session');
}
