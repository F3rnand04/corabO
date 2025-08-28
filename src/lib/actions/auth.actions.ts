
'use server';

import '@/ai/genkit';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { firebaseConfig } from '@/lib/firebase-config';


function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({ projectId: firebaseConfig.projectId });
}


/**
 * Securely signs in a user as a guest by generating a custom token on the server.
 */
export async function signInAsGuest(): Promise<{ customToken?: string; error?: string }> {
    try {
        initializeFirebaseAdmin();
        const auth = getAuth();
        // Create a temporary, unique ID for the anonymous user.
        const uid = `guest_${Date.now()}`;
        const customToken = await auth.createCustomToken(uid, { isGuest: true });
        return { customToken };
    } catch (error: any) {
        console.error('[ACTION_ERROR] signInAsGuest:', error);
        return { error: 'Failed to sign in as guest.' };
    }
}


/**
 * Creates a session cookie from the client's ID token.
 * This is the crucial server-side step to establish a persistent session.
 */
export async function createSessionCookie(idToken: string) {
    try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
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
