'use server';

import { cookies } from 'next/headers';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase-admin';
import type { FirebaseUserInput } from '@/lib/types';
import { getOrCreateUserFlow } from '@/ai/flows/profile-flow';

/**
 * Server action to get or create a user in Firestore.
 * This is called by the client-side AuthProvider.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
    const db = getFirebaseFirestore();
    const user = await getOrCreateUserFlow(db, firebaseUser);
    return user;
}


/**
 * Securely signs in a user as a guest by generating a custom token on the server.
 */
export async function signInAsGuest(): Promise<{ customToken?: string; error?: string }> {
    try {
        const auth = getFirebaseAuth();
        const db = getFirebaseFirestore();
        // Use a consistent but unique UID for the guest session to avoid creating new users on every click
        const uid = `guest_${Date.now()}`;
        const customToken = await auth.createCustomToken(uid);
        
        // Also ensure the user document is created server-side immediately
        await getOrCreateUserFlow(db, { uid: uid, displayName: "Invitado", email: null, photoURL: null, emailVerified: false });
        
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
        const db = getFirebaseFirestore();
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax' });
        
        // After setting the cookie, ensure the user exists in Firestore
        const decodedToken = await auth.verifyIdToken(idToken);
        await getOrCreateUserFlow(db, {
             uid: decodedToken.uid,
             email: decodedToken.email,
             displayName: decodedToken.name,
             photoURL: decodedToken.picture,
             emailVerified: decodedToken.email_verified || false,
        });

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
