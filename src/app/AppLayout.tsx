"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define routes where Header should be hidden
  const noHeaderRoutes = ['/companies'];

  const hideHeader = noHeaderRoutes.some(route => pathname.startsWith(route));
  const hideFooter = pathname.startsWith('/profile') || noHeaderRoutes.some(route => pathname.startsWith(route));

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
