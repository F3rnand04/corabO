
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingAuth } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si la carga de autenticación ha terminado y no hay usuario, redirigir a login.
    if (!isLoadingAuth && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  // 1. Estado de Carga: Mientras Firebase comprueba el estado, muestra un cargador.
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // 2. Estado No Autenticado: Si no está cargando y no hay usuario.
  if (!currentUser) {
     // Si ya estamos en la página de login, la renderizamos. Si no, mostramos un cargador mientras ocurre la redirección del useEffect.
     return pathname === '/login' ? <main>{children}</main> : (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
       );
  }
  
  // 3. Estado Autenticado: Si hay un usuario, renderizamos la app.
  
  // Admin Route Guard
  if (pathname.startsWith('/admin') && currentUser?.role !== 'admin') {
      if (typeof window !== 'undefined') {
          router.replace('/');
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  // --- Lógica de layout para usuarios autenticados ---
  const isClientWithInactiveTransactions = currentUser?.type === 'client' && !currentUser?.isTransactionsActive;
  
  // Define las rutas que NO deben tener el header o footer principal.
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
    '/admin', // Añade el panel de admin a la lista
  ];

  const shouldHideAllLayout = noHeaderFooterRoutes.some(path => pathname.startsWith(path));

  if(shouldHideAllLayout) {
    return <main>{children}</main>;
  }

  // El header principal se oculta en páginas de flujo completo o con headers personalizados.
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
       {isClientWithInactiveTransactions && (
         <div className={cn("bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm z-30", shouldShowMainHeader ? 'sticky top-16' : 'sticky top-0')}>
            <div className="container p-2 flex items-center justify-center text-center gap-2">
                 <AlertCircle className="h-5 w-5 shrink-0" />
                 <p className="flex-grow">
                    ¡Activa tu registro de transacciones para una experiencia de compra segura y con seguimiento!
                 </p>
                 <Button variant="ghost" size="sm" asChild className="text-current hover:bg-yellow-200 hover:text-current">
                    <Link href="/transactions">Activar ahora <ArrowRight className="h-4 w-4 ml-2"/></Link>
                 </Button>
            </div>
        </div>
      )}
      <main className="flex-grow">
        <div className={shouldShowFooter ? "pb-20" : ""}>
          {children}
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
