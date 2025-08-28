
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
  const { currentUser, isLoadingUser } = useCorabo();
  const { firebaseUser, isLoadingAuth } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/initial-setup';

  // This useEffect handles all redirection logic based on authentication and profile completion state.
  useEffect(() => {
    // Don't run redirection logic until auth and user profiles are fully resolved
    if (isLoadingAuth || isLoadingUser) {
      return; 
    }

    if (firebaseUser) {
      // User is authenticated
      if (currentUser === null) {
          // This case shouldn't be hit if isLoadingUser is false, but as a safeguard:
          // If we have a firebase user but no corabo user, something is wrong.
          // Forcing a logout might be an option, but for now, we wait.
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
  }, [isLoadingAuth, isLoadingUser, firebaseUser, currentUser, pathname, router, isAuthPage]);


  // Show a global loader while authentication or the initial user profile is being fetched.
  if (isLoadingAuth || (firebaseUser && isLoadingUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user is authenticated and we are on an auth page, allow rendering login/setup
  if (!firebaseUser && isAuthPage) {
    return <>{children}</>;
  }
  
  // If no user is authenticated and we are NOT on an auth page, render nothing until redirect happens.
  if (!firebaseUser && !isAuthPage) {
      return null;
  }
  
  // If user is authenticated but their profile is not complete, and they are on the setup page, show the page.
  if (firebaseUser && currentUser && !currentUser.isInitialSetupComplete && pathname === '/initial-setup') {
      return <>{children}</>;
  }

  // If user is authenticated and their profile IS complete, render the full app layout.
  if (firebaseUser && currentUser && currentUser.isInitialSetupComplete) {
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

  // Fallback case, typically shows loader or null until redirection logic completes
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
