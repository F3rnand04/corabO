
import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth-provider';
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { getOrCreateUser } from '@/lib/actions/user.actions';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  let initialUser: User | null = null;
  
  if (sessionCookie) {
    try {
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      const firebaseUser = await auth.getUser(decodedToken.uid);
      // We pass the full Firebase user object to getOrCreateUser
      initialUser = await getOrCreateUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        emailVerified: firebaseUser.emailVerified
      });
    } catch (error) {
      // Session cookie is invalid. No need to log, user is just not logged in.
      initialUser = null;
    }
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${'${inter.variable}'} antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider initialUser={initialUser}>
                {children}
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
