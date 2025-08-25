
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/app/AppLayout';
import { CoraboProvider } from '@/contexts/CoraboContext';
import { getFirebaseAdmin } from '@/lib/firebase-server';
import { cookies } from 'next/headers';
import type { User as FirebaseUser } from 'firebase/auth';


export const metadata: Metadata = {
  title: 'corabO.app',
  description: 'Aplicación Funcional corabO',
  manifest: '/manifest.json', // Correct path to manifest
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let serverFirebaseUser: FirebaseUser | null = null;
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (sessionCookie) {
      const { auth } = getFirebaseAdmin();
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      const userRecord = await auth.getUser(decodedClaims.uid);
      
      // We need to shape this object to match what the Firebase client SDK expects.
      // This is a simplified version.
      serverFirebaseUser = {
          uid: userRecord.uid,
          email: userRecord.email || null,
          displayName: userRecord.displayName || null,
          photoURL: userRecord.photoURL || null,
          emailVerified: userRecord.emailVerified,
          // Add other fields as needed, ensuring they are serializable
      } as FirebaseUser;
    }
  } catch (error) {
    // Session cookie is invalid or expired.
    // serverFirebaseUser remains null, which is the correct state.
    console.log('Session cookie verification failed. This is expected on logout or expiration.');
    serverFirebaseUser = null;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/Wz1MTvWK/lg.png" />
      </head>
      <body className={`${inter.variable} antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider serverFirebaseUser={serverFirebaseUser}>
              <CoraboProvider>
                <AppLayout>
                    {children}
                </AppLayout>
              </CoraboProvider>
            </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
