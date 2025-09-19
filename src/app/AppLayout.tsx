'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import LoginPage from './login/page';
import InitialSetupPage from './initial-setup/page';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAuth();
  
  const isSetupPage = pathname === '/initial-setup';

  useEffect(() => {
    // This effect ONLY handles redirection for LOGGED-IN users
    // who are NOT on the setup page but need to be.
    if (!isLoadingAuth && currentUser && !currentUser.isInitialSetupComplete && !isSetupPage) {
      router.push('/initial-setup');
    }
  }, [isLoadingAuth, currentUser, pathname, router, isSetupPage]);


  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, show the LoginPage. This is the main gate.
  if (!currentUser) {
    return <LoginPage />;
  }

  // If user exists but setup is incomplete
  if (!currentUser.isInitialSetupComplete) {
    // If we are already on the setup page, render it.
    if (isSetupPage) {
        return <InitialSetupPage />;
    }
    // Otherwise, render a loader while the useEffect redirects.
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // If fully logged in and setup is complete, render the full layout.
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
