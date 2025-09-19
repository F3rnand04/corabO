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
  let serverUser: User | null = null;
  
  if (sessionCookie) {
    try {
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      const firebaseUser = await auth.getUser(decodedToken.uid);
      serverUser = await getOrCreateUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        emailVerified: firebaseUser.emailVerified,
      });
    } catch (error) {
      // Failed to verify cookie, treat as logged out
      serverUser = null;
    }
  }

  if (!serverUser) {
    return <LoginPage />;
  }

  if (!serverUser.isInitialSetupComplete) {
    return <InitialSetupPage />;
  }
  
  // If user is authenticated and setup is complete, render the main app.
  return (
    <AppLayout>
      <FeedClientComponent />
    </AppLayout>
  );
}
