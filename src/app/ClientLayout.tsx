
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider'; 
import { useCorabo } from '@/contexts/CoraboContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth, signInWithGoogle } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoadingAuth) return;

    const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].some(p => pathname.startsWith(p));
    
    if (!currentUser) {
      if (!isPublicPage) {
        router.replace('/login');
      }
    } else {
      if (!currentUser.isInitialSetupComplete && !pathname.startsWith('/initial-setup')) {
          router.replace('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
          router.replace('/');
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
                <Bell className="mr-2 h-4 w-4" />
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

  if (shouldHideAllLayout) {
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
