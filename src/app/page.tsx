
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getOrCreateUser } from '@/lib/actions/user.actions';
import type { User } from '@/lib/types';

import LoginPage from './login/page';
import InitialSetupPage from './initial-setup/page';
import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from './AppLayout';

// This component is now the main gatekeeper, running on the server.
export default async function HomePage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return <LoginPage />;
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const firebaseUser = await auth.getUser(decodedToken.uid);
    const currentUser: User = await getOrCreateUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        emailVerified: firebaseUser.emailVerified,
    });

    if (!currentUser.isInitialSetupComplete) {
      // Pass the user object to the setup page if needed for pre-filling data
      return <InitialSetupPage />;
    }

    // If fully authenticated and setup is complete, show the main feed within the AppLayout
    return (
        <FeedClientComponent />
    );
  } catch (error) {
    // If the cookie is invalid, show the login page.
    console.error("Session cookie validation failed:", error);
    return <LoginPage />;
  }
}
