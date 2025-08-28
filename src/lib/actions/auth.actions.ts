
'use server';

import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/ai/genkit'; // Import the single admin auth instance


/**
 * Securely signs in a user as a guest by generating a custom token on the server.
 */
export async function signInAsGuest(): Promise<{ customToken?: string; error?: string }> {
    try {
        const auth = getFirebaseAuth(); // Use the central auth instance
        // Create a temporary, unique ID for the anonymous user.
        const uid = `guest_${Date.now()}`;
        const customToken = await auth.createCustomToken(uid, { isGuest: true });
        return { customToken };
    } catch (error: any) {
        console.error('[ACTION_ERROR] signInAsGuest:', error.message);
        return { error: 'Failed to sign in as guest.' };
    }
}


/**
 * Creates a session cookie from the client's ID token.
 * This is the crucial server-side step to establish a persistent session.
 */
export async function createSessionCookie(idToken: string) {
    try {
        const auth = getFirebaseAuth();
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax' });
        return { success: true };
    } catch (error) {
        console.error("Error creating session cookie", error);
        return { success: false, error: 'Could not create session cookie.' };
    }
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
    try {
        cookies().delete('session');
        return { success: true };
    } catch (error) {
        console.error("Error clearing session cookie", error);
        return { success: false, error: 'Could not clear session cookie.' };
    }
}
