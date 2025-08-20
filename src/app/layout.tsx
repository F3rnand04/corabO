
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CoraboProvider } from '@/contexts/CoraboContext';
import { AppLayout } from '@/app/AppLayout';


export const metadata: Metadata = {
  title: 'corabO.app',
  description: 'Aplicación Funcional corabO',
  manifest: '/manifest.json',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#B0D8FF" />
      </head>
      <body className={`${inter.variable} antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
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
