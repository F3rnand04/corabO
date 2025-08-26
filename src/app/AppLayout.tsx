
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useCorabo } from '@/contexts/CoraboContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoadingUser } = useCorabo();
  const { isLoadingAuth } = useAuth();


  useEffect(() => {
    if (isLoadingAuth || isLoadingUser) return;

    if (currentUser && !currentUser.isInitialSetupComplete) {
      if (pathname !== '/initial-setup') {
        router.push('/initial-setup');
      }
    } else if (!currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, isLoadingUser, isLoadingAuth, pathname, router]);

  if (isLoadingAuth || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser && pathname === '/login') {
    return <>{children}</>;
  }
  
  if (currentUser && !currentUser.isInitialSetupComplete) {
      if (pathname === '/initial-setup') {
          return <>{children}</>;
      }
      return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  const hideHeaderForPaths = [
    '/login',
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
    '/login',
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
