
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAuth();
  
  const isAuthPage = pathname === '/';
  const isSetupPage = pathname === '/initial-setup';

  useEffect(() => {
    if (isLoadingAuth) {
      return; 
    }

    if (currentUser) {
      if (!currentUser.isInitialSetupComplete && !isSetupPage) {
        router.push('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && isAuthPage) {
        // This case is tricky. If they are on '/' and logged in, children will handle it.
        // This can be removed if the root page handles the redirect itself.
      }
    } else {
      // If not logged in, they should be on the root/login page.
      if (!isAuthPage) {
        router.push('/');
      }
    }
  }, [isLoadingAuth, currentUser, pathname, router, isAuthPage, isSetupPage]);

  // Global loader
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not logged in, only render children if on the designated auth page ('/')
  if (!currentUser) {
    return isAuthPage ? <>{children}</> : null;
  }
  
  // If logged in but setup is not complete
  if (!currentUser.isInitialSetupComplete) {
    return isSetupPage ? <>{children}</> : null;
  }

  // If fully logged in and setup is complete
  const hideHeaderForPaths = [
    '/initial-setup',
    '/cashier-login',
    '/scan-qr',
    '/show-qr',
    '/videos',
    '/profile',
  ];

  const hideFooterForPaths = [
    '/messages', 
    '/scan-qr', 
    '/show-qr',
    '/admin',
    '/videos',
    '/initial-setup',
    '/cashier-login',
  ];

  const shouldHideHeader = hideHeaderForPaths.some(path => (pathname || '').startsWith(path));
  const shouldHideFooter = hideFooterForPaths.some(path => (pathname || '').startsWith(path));
  
  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideHeader && <Header />}
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
