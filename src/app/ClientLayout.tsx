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
import type { User } from '@/lib/types';


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth, setIsLoadingAuth, setCurrentUser, logout, getOrCreateUser } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuthInstance();
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

                if (!user) {
                  throw new Error("User data could not be retrieved from the server.");
                }
                setCurrentUser(user as User);
            } catch (error) {
                console.error("Error fetching/creating user:", error);
                toast({
                    variant: "destructive",
                    title: "Error de autenticación",
                    description: "No se pudo obtener la información de tu perfil. Por favor, intenta de nuevo.",
                });
                await logout();
            } finally {
                setIsLoadingAuth(false);
            }
        } else {
            setCurrentUser(null);
            setIsLoadingAuth(false);
        }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (isLoadingAuth) return;

    const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].includes(pathname);
    const isInSetupFlow = pathname.startsWith('/initial-setup') || pathname.startsWith('/profile-setup');

    if (!currentUser) {
        if (!isPublicPage) {
            router.replace('/login');
        }
    } else {
        if (!currentUser.isInitialSetupComplete) {
            if (!isInSetupFlow) {
                router.replace('/initial-setup');
            }
        } else {
             if (pathname === '/login' || pathname === '/initial-setup') {
                 router.replace('/');
             }
        }
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

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


  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const noLayoutRoutes = [
    '/login',
    '/cashier-login',
    '/map',
    '/credicora',
    '/policies',
    '/terms',
    '/privacy',
    '/community-guidelines',
    '/admin',
    '/initial-setup',
    '/profile-setup',
    '/transactions/settings/cashier',
    '/scan-qr',
  ];

  const shouldHideAllLayout = noLayoutRoutes.some(path => pathname.startsWith(path));

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
    '/search-history',
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
