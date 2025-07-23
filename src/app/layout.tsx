import type {Metadata} from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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
      <body className="font-body antialiased bg-background">
        <Providers>
            <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 overflow-y-auto pt-[148px] pb-20">
                    {children}
                </main>
                <Footer />
            </div>
        </Providers>
      </body>
    </html>
  );
}
