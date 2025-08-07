

"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  
  // This effect handles all redirection logic safely after the initial render.
  useEffect(() => {
    if (isLoadingAuth) {
      return; // Do nothing while auth state is loading
    }

    // If there is no user, and we are not on the login page, redirect to login
    if (!currentUser && pathname !== '/login') {
      router.replace('/login');
    }
    
    // If there is a user, but they haven't completed the initial setup, redirect them
    if (currentUser && !currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
      router.replace('/initial-setup');
    }

    // If user is fully set up but on a setup/login page, redirect to home
    if (currentUser && currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
      router.replace('/');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);


  // 1. While checking auth state, show a global loader
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // 2. If no user, or user is in setup, render the specific page without main layout
  if (!currentUser || !currentUser.isInitialSetupComplete) {
     if (pathname === '/login' || pathname === '/initial-setup') {
        return <main>{children}</main>;
     }
     // While redirecting, show a loader
     return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  // 3. If authenticated and setup is complete, render the main app layout
  if(currentUser && currentUser.isInitialSetupComplete) {
      // Admin Route Guard
      if (pathname.startsWith('/admin') && currentUser?.role !== 'admin') {
          router.replace('/');
          return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          );
      }

      const isClientWithInactiveTransactions = currentUser?.type === 'client' && !currentUser?.isTransactionsActive;
      
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
        '/admin',
        '/initial-setup',
      ];

      const shouldHideAllLayout = noHeaderFooterRoutes.some(path => pathname.startsWith(path));

      if(shouldHideAllLayout) {
        return <main>{children}</main>;
      }

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
           {isClientWithInactiveTransactions && (
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

  // Fallback for any other case (should not be reached)
  return null;
}
