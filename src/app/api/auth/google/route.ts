
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getOrCreateUser } from '@/lib/actions/auth.actions';
import { Auth, GoogleAuthProvider } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// This function simulates the frontend part of the OAuth flow on the server.
// In a real scenario, you might use a library like 'next-auth' or handle redirects.
// For this prototype, we'll assume the user is "logged in" via a simulated popup
// and we just need to formalize the session.

async function getRedirectResult(auth: Auth) {
    // THIS IS A SIMULATION. In a real OAuth flow, you'd get this from the provider.
    // We are creating a dummy user to simulate a successful Google Sign-In.
    const now = Date.now();
    const dummyEmail = `testuser_${now}@corabo.app`;
    const dummyName = `Test User ${now}`;
    
    try {
        let userRecord = await auth.getUserByEmail(dummyEmail).catch(() => null);
        if (!userRecord) {
             userRecord = await auth.createUser({
                email: dummyEmail,
                displayName: dummyName,
                emailVerified: true,
            });
        }
       
        return {
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                emailVerified: userRecord.emailVerified,
            }
        };

    } catch(error) {
        console.error("Error creating dummy user for OAuth simulation:", error);
        return null;
    }
}


export async function GET(request: NextRequest) {
  const auth = getFirebaseAuth();
  
  try {
    // In a real app, this would be the result from the Google redirect.
    // We simulate it here for demonstration.
    const result = await getRedirectResult(auth);

    if (!result || !result.user) {
        console.error("OAuth simulation failed or was cancelled.");
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    const firebaseUser = result.user;

    // Get or create the user profile in Firestore
    await getOrCreateUser(firebaseUser);
    
    // Create a custom token for the user
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    // Set the custom token in a secure, httpOnly cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set({
        name: 'custom-token',
        value: customToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });
    
    return response;
  } catch (error: any) {
    console.error("Error during Google Auth processing:", error);
    if (error.code === 'auth/credential-already-in-use') {
        return NextResponse.redirect(new URL('/?error=email-in-use', request.url));
    }
    return NextResponse.redirect(new URL('/?error=unknown', request.url));
  }
}
