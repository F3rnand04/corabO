
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CoraboProvider } from '@/contexts/CoraboContext';

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
                <ClientLayout>{children}</ClientLayout>
              </CoraboProvider>
            </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
