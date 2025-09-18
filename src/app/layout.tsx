
import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth-provider';
import { AppLayout } from './AppLayout';
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { getOrCreateUser } from '@/lib/actions/user.actions';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This is now a Server Component that fetches the initial user state.
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
      // Now that we have the Firebase user, get/create our custom user profile
      initialUser = await getOrCreateUser(firebaseUser);
    } catch (error) {
      // Cookie is invalid, expired, etc. Treat as logged out.
      console.log('Session cookie verification failed:', error);
      initialUser = null;
    }
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider initialUser={initialUser}>
                <AppLayout>
                  {children}
                </AppLayout>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
