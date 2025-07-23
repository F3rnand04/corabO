"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isProfilePage = pathname === '/profile';

  return (
    <div className="flex flex-col min-h-screen">
      {!isProfilePage && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isProfilePage && <Footer />}
    </div>
  );
}
