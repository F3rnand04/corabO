"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  const isCompanyProfilePage = pathname.startsWith('/companies/');

  const shouldShowMainHeaderFooter = !isProfilePage && !isCompanyProfilePage;

  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeaderFooter && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowMainHeaderFooter && <Footer />}
    </div>
  );
}
