
import type {Metadata} from 'next';
import './globals.css';
import { Providers } from './providers';
import AppLayout from './AppLayout';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'corabO.app',
  description: 'Aplicación Funcional corabO',
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
      <body className={`${inter.variable} antialiased bg-background`}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
