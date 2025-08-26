import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/app/AppLayout';
import { CoraboProvider } from '@/contexts/CoraboContext';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAdmin } from '@/lib/firebase-server';
import { cookies } from 'next/headers';


export const metadata: Metadata = {
  title: 'corabO.app',
  description: 'Aplicación Funcional corabO',
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
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (sessionCookie) {
      const decodedIdToken = await getFirebaseAdmin().auth.verifySessionCookie(sessionCookie, true);
      const userRecord = await getFirebaseAdmin().auth.getUser(decodedIdToken.uid);
      serverFirebaseUser = {
        ...userRecord,
        getIdToken: async () => sessionCookie,
      } as unknown as FirebaseUser;
    }
  } catch (error) {
    // Session cookie is invalid or expired.
    console.log("RootLayout auth error:", error);
    serverFirebaseUser = null;
  }
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body className={`'__variable_e8ce0c' antialiased bg-background`}>
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
