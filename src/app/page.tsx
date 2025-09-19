
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getOrCreateUser } from '@/lib/actions/user.actions';
import type { User } from '@/lib/types';
import { MainPage } from '@/app/MainPage';

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
      serverUser = null;
    }
  }

  // We pass the server-fetched user to the client-side decision maker.
  return <MainPage serverUser={serverUser} />;
}
