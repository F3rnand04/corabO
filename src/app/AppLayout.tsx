
"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  const isCompanyProfilePage = pathname.startsWith('/companies/');
  const isVideosPage = pathname === '/videos';
  const isProfileSetupPage = pathname === '/profile-setup';
  const isQuotesPage = pathname === '/quotes';
  const isContactsPage = pathname === '/contacts';
  const isSearchPage = pathname === '/search';

  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage;
  const shouldShowFooter = !isProfilePage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      <main className="flex-grow">
        <div className={!isSearchPage ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
