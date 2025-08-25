
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
      
      // We only need the UID on the server, the client will get the full user object
      serverFirebaseUser = {
          uid: decodedClaims.uid,
          // The rest of the fields will be populated by the client-side onAuthStateChanged listener
      } as FirebaseUser;
    }
  } catch (error) {
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
