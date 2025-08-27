
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
  const { currentUser } = useCorabo();
  const { isLoadingAuth, firebaseUser } = useAuth();

  // This useEffect handles all redirection logic based on authentication and profile completion state.
  useEffect(() => {
    // Don't run redirection logic until auth is resolved
    if (isLoadingAuth) {
      return; 
    }

    const isAuthPage = pathname === '/login' || pathname === '/initial-setup';

    if (firebaseUser) {
      // User is authenticated
      if (currentUser === null) {
          // If we have a firebase user but are waiting for the corabo user profile to load, do nothing.
          // This prevents flickers. The loader below will handle the visual state.
          return;
      }

      if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
        // If setup is not complete, they MUST be on the setup page
        router.push('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && isAuthPage) {
        // If setup is complete, they should NOT be on login or setup pages
        router.push('/');
      }
    } else {
      // No user is authenticated
      if (!isAuthPage) {
        router.push('/login');
      }
    }
  }, [isLoadingAuth, firebaseUser, currentUser, pathname, router]);


  // Show a global loader while authentication or the initial user profile is being fetched.
  if (isLoadingAuth || (firebaseUser && currentUser === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user is authenticated and we are not on the login page, render nothing until redirect happens.
  // This prevents flashing content on protected routes before redirecting.
  if (!firebaseUser && pathname !== '/login') {
      return null;
  }

  // Determine if the header and footer should be hidden based on the current path.
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
