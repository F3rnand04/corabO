'use server';

import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import type { FirebaseUserInput } from '@/lib/types';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';

/**
 * Securely signs in a user as a guest by generating a custom token on the server.
 */
export async function signInAsGuest(): Promise<{ customToken?: string; error?: string }> {
    try {
        const auth = getFirebaseAuth();
        // Use a consistent but unique UID for the guest session to avoid creating new users on every click
        const uid = `guest_user_session`; 
        const customToken = await auth.createCustomToken(uid);
        return { customToken };
    } catch (error: any) {
        console.error('[ACTION_ERROR] signInAsGuest:', error.message);
        return { error: 'Failed to create guest token.' };
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

export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
    return await getOrCreateUserFlow(firebaseUser);
}
