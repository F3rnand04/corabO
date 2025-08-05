
"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCorabo();
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
  const isChatPage = /^\/messages\/.+/.test(pathname);

  const isClientWithInactiveTransactions = currentUser.type === 'client' && !currentUser.isTransactionsActive;

  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage && !isTransactionsPage && !isTransactionsSettingsPage && !isMessagesPage && !isChatPage;
  const shouldShowFooter = !isProfilePage && !isProfileSetupPage && !isQuotesPage && !isContactsPage && !isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage && !isTransactionsPage && !isTransactionsSettingsPage && !isMessagesPage && !isChatPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      {isClientWithInactiveTransactions && !isTransactionsPage && (
         <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm">
            <div className="container p-2 flex items-center justify-center text-center gap-2">
                 <AlertCircle className="h-5 w-5 shrink-0" />
                 <p className="flex-grow">
                     ¡Activa tu registro de transacciones para una experiencia de compra segura y con seguimiento!
                 </p>
                 <Button variant="ghost" size="sm" asChild className="text-current hover:bg-yellow-200 hover:text-current">
                    <Link href="/transactions">Activar ahora <ArrowRight className="h-4 w-4 ml-2"/></Link>
                 </Button>
            </div>
        </div>
      )}
      <main className="flex-grow">
        <div className={!isSearchPage && !isMapPage && !isQuotesPaymentPage && !isQuotesProPage ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
