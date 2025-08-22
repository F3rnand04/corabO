import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <AppLayout>
                  {children}
              </AppLayout>
            </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
