'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect } from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoadingUser, currentUser } = useCorabo();
  const { isLoadingAuth, firebaseUser } = useAuth();

  // New useEffect to handle redirection based on auth state
  useEffect(() => {
    // If auth is done loading and there's no firebase user, force to login
    if (!isLoadingAuth && !firebaseUser) {
      if(pathname !== '/login') {
         router.push('/login');
      }
      return;
    }
    
    // If we have a firebase user but not the full Corabo user yet, we wait.
    // If after waiting there is a user and they haven't completed setup, redirect them.
    if (firebaseUser && !isLoadingUser && currentUser) {
        if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
            router.push('/initial-setup');
        } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
            router.push('/');
        }
    }

  }, [isLoadingAuth, firebaseUser, isLoadingUser, currentUser, pathname, router]);


  if (isLoadingAuth || (firebaseUser && isLoadingUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Determine if the header and footer should be hidden
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

  // The problematic conditional rendering that caused the 404 is removed.
  // The layout is now rendered consistently, and visibility is handled by shouldHideHeader/Footer.

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideHeader && <Header />}
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
