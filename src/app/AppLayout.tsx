
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
import { getAuth, onAuthStateChanged, getRedirectResult } from 'firebase/auth';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth, handleUserAuth, logout } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuth();

    // This handles both the initial page load and the return from a redirect.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            // User is signed in, let the context handle it.
            handleUserAuth(firebaseUser);
        } else {
            // No user is signed in. Check if they are returning from a redirect.
            getRedirectResult(auth)
                .then((result) => {
                    if (!result) {
                        // This means there's no active session and they are not coming from a redirect.
                        // So, they must be directed to login unless they are already there.
                        if (pathname !== '/login') {
                            router.replace('/login');
                        }
                    }
                    // If 'result' is not null, the onAuthStateChanged will trigger again with the new user,
                    // so we don't need to do anything else here.
                })
                .catch((error) => {
                    console.error("Error getting redirect result:", error);
                    toast({ variant: 'destructive', title: 'Error de autenticación', description: 'No se pudo completar el inicio de sesión.' });
                })
                .finally(() => {
                    // This ensures that even if there's an error, we mark loading as false
                    // to prevent an infinite loading state.
                    if(!auth.currentUser) handleUserAuth(null);
                });
        }
    });

    return () => unsubscribe();
  }, [handleUserAuth, pathname, router, toast]);


  // This effect handles redirection for a logged-in user to the correct page
  useEffect(() => {
    if (isLoadingAuth) return; // Wait until auth state is determined

    if (currentUser) {
        if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
            router.replace('/initial-setup');
        } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
            router.replace('/');
        }
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  // Request notification permission
  useEffect(() => {
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

  return null;
}
