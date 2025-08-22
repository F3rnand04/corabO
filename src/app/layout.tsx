
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
  manifest: '/manifest.json',
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
      const firebaseAdmin = getFirebaseAdmin();
      const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
      const userRecord = await firebaseAdmin.auth().getUser(decodedClaims.uid);
      
      // Adapt the UserRecord to the FirebaseUser type expected by the client
      serverFirebaseUser = {
          uid: userRecord.uid,
          email: userRecord.email || null,
          displayName: userRecord.displayName || null,
          photoURL: userRecord.photoURL || null,
          emailVerified: userRecord.emailVerified,
          // Add other properties if needed, ensuring they match the client's FirebaseUser type
      } as FirebaseUser;
    }
  } catch (error) {
    console.error("Server-side session verification failed:", error);
    serverFirebaseUser = null;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
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
