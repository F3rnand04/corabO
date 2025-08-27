import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/app/AppLayout';
import { CoraboProvider } from '@/contexts/CoraboContext';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import type { User as FirebaseUserType } from 'firebase-admin/auth';
import type { FirebaseUserInput, User } from '@/lib/types';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';

export const metadata: Metadata = {
  title: 'corabO.app',
  description: 'Conecta, Colabora y Crece. La plataforma para profesionales y clientes.',
  manifest: '/manifest.webmanifest',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This function safely gets the initial user data on the server.
async function getInitialUser(): Promise<{ serverFirebaseUser: FirebaseUserType | null, initialCoraboUser: User | null }> {
    try {
        const auth = getAuth();
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) {
            return { serverFirebaseUser: null, initialCoraboUser: null };
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const serverFirebaseUser = await auth.getUser(decodedToken.uid);

        const userInput: FirebaseUserInput = {
            uid: serverFirebaseUser.uid,
            email: serverFirebaseUser.email,
            displayName: serverFirebaseUser.displayName,
            photoURL: serverFirebaseUser.photoURL,
            phoneNumber: serverFirebaseUser.phoneNumber,
            emailVerified: serverFirebaseUser.emailVerified,
        };
        const initialCoraboUser = await getOrCreateUserFlow(userInput);

        return { serverFirebaseUser, initialCoraboUser };
    } catch (error) {
        // This can happen if the cookie is expired or invalid. It's not an error.
        return { serverFirebaseUser: null, initialCoraboUser: null };
    }
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { serverFirebaseUser, initialCoraboUser } = await getInitialUser();
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body className={`'__variable_e8ce0c' antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider serverFirebaseUser={serverFirebaseUser}>
            <CoraboProvider initialCoraboUser={initialCoraboUser}>
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
