
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  if (isLoadingAuth || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
     if (pathname !== '/login') {
       return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
       )
     }
     return <main>{children}</main>;
  }
  
  // Admin Route Guard
  if (pathname.startsWith('/admin') && currentUser?.role !== 'admin') {
      if (typeof window !== 'undefined') {
          router.replace('/');
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }


  const isClientWithInactiveTransactions = currentUser?.type === 'client' && !currentUser?.isTransactionsActive;
  
  // Define routes that should NOT have the main header or footer
  const noHeaderFooterRoutes = [
    '/profile-setup',
    '/login',
    '/map',
    '/credicora',
    '/search-history',
    '/policies',
    '/terms',
    '/privacy',
    '/community-guidelines',
    '/admin', // Add admin panel to the list
  ];

  const shouldHideAllLayout = noHeaderFooterRoutes.some(path => pathname.startsWith(path));

  if(shouldHideAllLayout) {
    return <main>{children}</main>;
  }

  // El header principal se oculta en páginas de flujo completo o con headers personalizados.
  const shouldShowMainHeader = ![
    '/profile',
    '/quotes',
    '/quotes/payment',
    '/quotes/pro',
    '/contacts',
    '/search',
    '/transactions',
    '/transactions/settings',
    '/messages',
    '/videos',
    '/emprende',
  ].includes(pathname) && !/^\/messages\/.+/.test(pathname) && !/^\/companies\/.+/.test(pathname);
  
  const shouldShowFooter = !/^\/messages\/.+/.test(pathname);
  
  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
       {isClientWithInactiveTransactions && !isTransactionsPage && !isTransactionsSettingsPage && (
         <div className={cn("bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm z-30", shouldShowMainHeader ? 'sticky top-16' : 'sticky top-0')}>
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
        <div className={shouldShowFooter ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
