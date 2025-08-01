
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
  const isQuotesProPage = pathname === '/quotes/pro';
  const isTransactionsPage = pathname === '/transactions';
  const isTransactionsSettingsPage = pathname === '/transactions/settings';
  const isMessagesPage = pathname === '/messages';


  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage && !isTransactionsPage && !isTransactionsSettingsPage && !isMessagesPage;
  const shouldShowFooter = !isProfilePage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage && !isTransactionsPage && !isTransactionsSettingsPage && !isMessagesPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      <main className="flex-grow">
        <div className={!isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
