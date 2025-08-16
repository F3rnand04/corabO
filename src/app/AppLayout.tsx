
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
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth, handleUserAuth, logout } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuthInstance();
    // This effect runs once on initial mount to set up the auth listener.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        // This function will be called whenever the user's login state changes.
        await handleUserAuth(firebaseUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    // This effect handles redirection based on the auth state.
    if (isLoadingAuth) {
        // While auth state is resolving, do nothing to prevent premature redirects.
        return;
    }

    const isLoginPage = pathname === '/login';
    const isSetupPage = pathname === '/initial-setup';

    if (!currentUser) {
        // User is not logged in, redirect to login page if not already there.
        if (!isLoginPage) {
            router.replace('/login');
        }
    } else {
        // User is logged in.
        if (!currentUser.isInitialSetupComplete) {
            // If setup is not complete, force user to the setup page.
            if (!isSetupPage) {
                router.replace('/initial-setup');
            }
        } else {
            // If setup is complete, redirect away from login/setup pages.
            if (isLoginPage || isSetupPage) {
                router.replace('/');
            }
        }
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  useEffect(() => {
    // This effect handles notification permission prompts.
    if (typeof window !== 'undefined' && 'Notification' in window && currentUser) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        setTimeout(() => {
             toast({
              title: '¿Activar notificaciones?',
              description: 'Mantente al día con mensajes, ofertas y recordatorios importantes.',
              action: (
                <Button onClick={() => {
                   Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      console.log('Notification permission granted.');
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


  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isLoginPage = pathname === '/login';
  const isSetupPage = pathname === '/initial-setup';

  // If the user is not logged in, and we are not already on the login page,
  // show a loader until the redirection logic kicks in.
  if (!currentUser && !isLoginPage) {
     return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  // Render the login or setup page without the main layout
  if (isLoginPage || (currentUser && !currentUser.isInitialSetupComplete && isSetupPage)) {
    return <main>{children}</main>;
  }
  
  // Render the full app layout for authenticated and set-up users
  if(currentUser && currentUser.isInitialSetupComplete) {
      // Admin role check
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

      // Main application view with Header and Footer
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

  // Fallback return null if no other condition is met
  return null;
}

    