

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
    
    // This handles the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await handleUserAuth(result.user);
        }
      })
      .catch((error) => {
        // Handle specific auth errors if needed
        console.error("Error getting redirect result:", error);
        if (error.code === 'auth/account-exists-with-different-credential') {
            toast({
                variant: 'destructive',
                title: 'Error de Autenticación',
                description: 'Ya existe una cuenta con el mismo correo electrónico pero con un método de inicio de sesión diferente.'
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error de Autenticación',
                description: 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.'
            });
        }
      });
      
    // This handles user session changes (login, logout)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // We call handleUserAuth here to ensure the state is always in sync
      // with Firebase's auth state. It handles both login and logout cases.
      if (!currentUser && firebaseUser) {
        await handleUserAuth(firebaseUser);
      } else if (currentUser && !firebaseUser) {
        await handleUserAuth(null);
      }
    });


    return () => unsubscribe();
  }, [handleUserAuth, toast, currentUser]);


  // This effect handles redirection for a logged-in user to the correct page
  useEffect(() => {
    if (isLoadingAuth) return; // Wait until auth state is determined

    if (currentUser) {
        if (!currentUser.isInitialSetupComplete && pathname !== '/initial-setup') {
            router.replace('/initial-setup');
        } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
            router.replace('/');
        }
    } else if (!isLoadingAuth && pathname !== '/login') {
        router.replace('/login');
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
