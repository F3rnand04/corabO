'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { signInAsGuestFlow } from '@/ai/flows/auth-flow';

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
