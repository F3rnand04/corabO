
import type {Metadata} from 'next';
import './globals.css';
import { Providers } from './providers';
import AppLayout from './AppLayout';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Corabo Demo',
  description: 'Demo funcional de la aplicación Corabo',
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
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
