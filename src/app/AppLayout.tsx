
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
import { getOrCreateUser } from '@/ai/flows/auth-flow';
import type { User } from '@/lib/types';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth, setIsLoadingAuth, setCurrentUser, logout } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuthInstance();
    // This effect runs once on initial mount to set up the auth listener.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            try {
                const user = await getOrCreateUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                    emailVerified: firebaseUser.emailVerified
                });
                setCurrentUser(user as User | null);
            } catch (error) {
                console.error("Error fetching/creating user:", error);
                setCurrentUser(null);
                 toast({
                    variant: "destructive",
                    title: "Error de autenticación",
                    description: "No se pudo obtener la información de tu perfil.",
                });
            } finally {
                setIsLoadingAuth(false);
            }
        } else {
            setCurrentUser(null);
            setIsLoadingAuth(false);
        }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once.


  useEffect(() => {
    if (isLoadingAuth) return;

    const isLoginPage = pathname === '/login';
    const isSetupPage = pathname === '/initial-setup';
    const isProfileSetupPage = pathname === '/profile-setup';

    if (!currentUser) {
        if (!isLoginPage) {
            router.replace('/login');
        }
    } else {
        if (!currentUser.isInitialSetupComplete) {
            if (!isSetupPage) {
                router.replace('/initial-setup');
            }
        // **UPDATED LOGIC**: If company profile setup is done, redirect away from it.
        } else if (currentUser.profileSetupData?.providerType === 'company' && currentUser.profileSetupData?.specialty) {
            if (isProfileSetupPage) {
                router.replace('/profile/details');
            }
        } else {
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
  
  // If no user, only render the login page.
  if (!currentUser) {
    return pathname === '/login' ? <main>{children}</main> : (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If user is not setup, only render the setup page.
  if (!currentUser.isInitialSetupComplete) {
     return pathname === '/initial-setup' ? <main>{children}</main> : (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Admin role check
  if (pathname.startsWith('/admin') && currentUser.role !== 'admin') {
      router.replace('/');
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }
  
  const noHeaderFooterRoutes = [
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
    '/profile-setup', // The entire profile setup flow is immersive
    '/transactions/settings/cashier', // Hides for the dedicated cashier management page
    '/scan-qr', // Hide on QR scan page for immersive experience
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
  ].includes(pathname) && !/^\/messages\/.+/.test(pathname) && !/^\/companies\/.+/.test(pathname) && !/^\/profile\/.+/.test(pathname);
  
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
