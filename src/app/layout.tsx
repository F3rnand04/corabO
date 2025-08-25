
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
      
      serverFirebaseUser = {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          displayName: decodedClaims.name,
          photoURL: decodedClaims.picture,
          emailVerified: decodedClaims.email_verified,
      } as FirebaseUser;
    }
  } catch (error) {
    console.log('Session cookie verification failed. Expected on logout/expiration.');
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
      <body className={`'__variable_e8ce0c' antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          <CoraboProvider>
            <AuthProvider serverFirebaseUser={serverFirebaseUser}>
                <AppLayout>
                    {children}
                </AppLayout>
            </AuthProvider>
          </CoraboProvider>
        </Providers>
      </body>
    </html>
  );
}
