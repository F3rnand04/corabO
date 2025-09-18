
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import LoginPage from './login/page';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAuth();
  
  const isSetupPage = pathname === '/initial-setup';

  useEffect(() => {
    // This effect now ONLY handles redirection for LOGGED-IN users.
    if (!isLoadingAuth && currentUser) {
      if (!currentUser.isInitialSetupComplete && !isSetupPage) {
        router.push('/initial-setup');
      }
    }
  }, [isLoadingAuth, currentUser, pathname, router, isSetupPage]);


  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, it means we must show the LoginPage.
  if (!currentUser) {
    return <LoginPage />;
  }

  // If the user exists but hasn't completed setup, show only the setup page.
  if (!currentUser.isInitialSetupComplete) {
    // Only render the children if we are on the correct setup page.
    // Otherwise, render nothing while the useEffect redirects.
    return isSetupPage ? <>{children}</> : null;
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
