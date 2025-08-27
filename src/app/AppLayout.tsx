
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

  // This useEffect handles all redirection logic based on authentication and profile completion state.
  useEffect(() => {
    // Wait until both auth and user data are loaded to make a decision
    if (isLoadingAuth || (firebaseUser && isLoadingUser)) {
      return; // Do nothing while loading
    }

    if (firebaseUser && currentUser) {
      // User is authenticated and we have their Corabo profile
      if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
        // If setup is not complete, they MUST be on the setup page
        router.push('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
        // If setup is complete, they should NOT be on login or setup pages
        router.push('/');
      }
    } else if (!firebaseUser && pathname !== '/login') {
      // If no user is authenticated, they should be on the login page
      router.push('/login');
    }
  }, [isLoadingAuth, firebaseUser, isLoadingUser, currentUser, pathname, router]);


  // Show a global loader while authentication or user data is being fetched.
  if (isLoadingAuth || (firebaseUser && isLoadingUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
  
  // If no user is authenticated and we are not on the login page, render nothing until redirect happens.
  // This prevents flashing content. The useEffect above will handle the redirect.
  if (!firebaseUser && pathname !== '/login') {
      return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideHeader && <Header />}
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
