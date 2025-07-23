import type {Metadata} from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Corabo Demo',
  description: 'Demo funcional de la aplicación Corabo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Providers>
            <Header />
            <div className="flex-1">
                {children}
            </div>
        </Providers>
      </body>
    </html>
  );
}
