
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/app/AppLayout';
import { CoraboProvider } from '@/contexts/CoraboContext';
import type { User as FirebaseUser } from 'firebase/auth';


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
  // The server-side session check has been removed.
  // The client-side AuthProvider will now be the single source of truth
  // for handling the initial authentication state, which correctly
  // handles the redirect flow from Google sign-in.
  const serverFirebaseUser: FirebaseUser | null = null;
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
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
