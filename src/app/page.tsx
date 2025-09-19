import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from './AppLayout';
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getOrCreateUser } from './actions';
import LoginPage from './login/page';
import InitialSetupPage from './initial-setup/page';

// This component is now the main gatekeeper, running on the server.
export default async function HomePage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  let serverUser = null;

  if (sessionCookie) {
    try {
      const decodedToken = await getFirebaseAuth().verifySessionCookie(sessionCookie, true);
      const firebaseUser = await getFirebaseAuth().getUser(decodedToken.uid);
      serverUser = await getOrCreateUser(firebaseUser);
    } catch (error) {
      console.warn("Invalid session cookie. Forcing logout.");
      serverUser = null;
    }
  }

  if (!serverUser) {
    return <LoginPage />;
  }

  if (!serverUser.isInitialSetupComplete) {
    return <InitialSetupPage />;
  }

  return (
    <AppLayout>
      <FeedClientComponent />
    </AppLayout>
  );
}
