'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * This component now centralizes the routing logic previously in AppLayout.
 */
export function AppRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoadingUser } = useCorabo();
  const { isLoadingAuth } = useAuth();
  
  // This list includes all publicly accessible routes.
  const publicRoutes = ['/login'];

  useEffect(() => {
    if (isLoadingAuth || isLoadingUser) {
      return; // Wait until all authentication and user data loading is complete.
    }
    
    const isPublicPath = publicRoutes.some(path => pathname.startsWith(path));

    if (!currentUser && !isPublicPath) {
      // If user is not logged in and not on a public page, redirect to login.
      router.push('/login');
    } else if (currentUser) {
      // If user is logged in, handle initial setup completion.
      if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
        router.push('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
        // If setup is complete and user is on login or setup page, redirect to home.
        router.push('/');
      }
    }
  }, [currentUser, isLoadingUser, isLoadingAuth, pathname, router]);

  // Render children immediately. The useEffect handles the routing logic.
  return <>{children}</>;
}
