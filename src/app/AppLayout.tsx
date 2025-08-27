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

  // This useEffect handles redirection AFTER a user is confirmed to exist.
  useEffect(() => {
    // If we have a firebase user but not the full Corabo user yet, we wait.
    // If after waiting there is a user and they haven't completed setup, redirect them.
    if (firebaseUser && !isLoadingUser && currentUser) {
        if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
            router.push('/initial-setup');
        } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
            router.push('/');
        }
    } else if (!isLoadingAuth && !firebaseUser && pathname !== '/login') {
        // Fallback for edge cases, pushing to login if no user is found after loading.
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
  // This approach is more declarative and avoids conditional rendering of the main layout structure.
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
