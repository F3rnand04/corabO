
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
  const isMapPage = pathname === '/map';
  const isQuotesPaymentPage = pathname === '/quotes/payment';

  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage;
  const shouldShowFooter = !isProfilePage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      <main className="flex-grow">
        <div className={!isSearchPage && !isMapPage && !isQuotesPaymentPage ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
