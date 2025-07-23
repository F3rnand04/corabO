"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define routes where Header and/or Footer should be hidden
  const noHeaderRoutes = ['/companies', '/profile'];
  const noFooterRoutes = ['/companies', '/profile'];

  const hideHeader = noHeaderRoutes.some(route => pathname.startsWith(route));
  const hideFooter = noFooterRoutes.some(route => pathname.startsWith(route));

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
