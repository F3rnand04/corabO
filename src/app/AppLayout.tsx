
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // This effect handles all redirection logic safely after the initial render.
  useEffect(() => {
    if (isLoadingAuth) {
      return; // Do nothing while auth state is loading
    }

    // If there is no user, and we are not on the login page, redirect to login
    if (!currentUser && pathname !== '/login') {
      router.replace('/login');
    }
    
    // If there is a user, but they haven't completed the initial setup, redirect them
    if (currentUser && !currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
      router.replace('/initial-setup');
    }

    // If user is fully set up but on a setup/login page, redirect to home
    if (currentUser && currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
      router.replace('/');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && currentUser) {
      // Check if permission was already granted or denied
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        setTimeout(() => { // Delay the request slightly
             toast({
              title: '¿Activar notificaciones?',
              description: 'Mantente al día con mensajes, ofertas y recordatorios importantes.',
              action: (
                <Button onClick={() => {
                   Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      console.log('Notification permission granted.');
                      // You could save this preference to the user's profile
                    }
                  });
                }}>
                  <Bell className="mr-2 h-4 w-4"/>
                  Activar
                </Button>
              ),
              duration: 10000,
            });
        }, 5000);
      }
    }
  }, [currentUser, toast]);


  // 1. While checking auth state, show a global loader
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // 2. If no user, or user is in setup, render the specific page without main layout
  if (!currentUser || !currentUser.isInitialSetupComplete) {
     if (pathname === '/login' || pathname === '/initial-setup') {
        return <main>{children}</main>;
     }
     // While redirecting, show a loader
     return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  // 3. If authenticated and setup is complete, render the main app layout
  if(currentUser && currentUser.isInitialSetupComplete) {
      // Admin Route Guard
      if (pathname.startsWith('/admin') && currentUser?.role !== 'admin') {
          router.replace('/');
          return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          );
      }
      
      const noHeaderFooterRoutes = [
        '/profile-setup',
        '/login',
        '/map',
        '/credicora',
        '/search-history',
        '/policies',
        '/terms',
        '/privacy',
        '/community-guidelines',
        '/admin',
        '/initial-setup',
        '/profile/publications',
        '/profile/catalog',
      ];

      const shouldHideAllLayout = noHeaderFooterRoutes.some(path => pathname.startsWith(path));

      if(shouldHideAllLayout) {
        return <main>{children}</main>;
      }

      const shouldShowMainHeader = ![
        '/profile',
        '/quotes',
        '/quotes/payment',
        '/quotes/pro',
        '/contacts',
        '/search',
        '/transactions',
        '/transactions/settings',
        '/messages',
        '/videos',
        '/emprende',
      ].includes(pathname) && !/^\/messages\/.+/.test(pathname) && !/^\/companies\/.+/.test(pathname);
      
      const shouldShowFooter = !/^\/messages\/.+/.test(pathname);
      
      return (
        <div className="flex flex-col min-h-screen">
          {shouldShowMainHeader && <Header />}
          <main className="flex-grow">
            <div className={shouldShowFooter ? "pb-20" : ""}>
              {children}
            </div>
          </main>
          {shouldShowFooter && <Footer />}
        </div>
      );
  }

  // Fallback for any other case (should not be reached)
  return null;
}
