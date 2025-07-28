
"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  const isCompanyProfilePage = pathname.startsWith('/companies/');
  const isVideosPage = pathname === '/videos';
  const isSettingsPage = pathname === '/settings';
  const isQuotesPage = pathname === '/quotes';
  const isContactsPage = pathname === '/contacts';

  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage && !isSettingsPage && !isQuotesPage && !isContactsPage;
  const shouldShowFooter = !isProfilePage && !isSettingsPage && !isQuotesPage && !isContactsPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
