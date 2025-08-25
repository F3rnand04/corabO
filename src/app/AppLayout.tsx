
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';

// Este es el guardián de la aplicación. Su única responsabilidad es decidir
// qué se debe renderizar basándose en el estado de autenticación y perfil del usuario.
function LayoutController({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingUser } = useCorabo();
  const { firebaseUser, isLoadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/cashier-login'];

  // Dado que la autenticación está deshabilitada, renderizamos directamente el contenido.
  // Mantenemos una estructura básica para una futura reimplementación.
  if (isLoadingUser || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Lógica de renderizado simplificada sin autenticación
  const hideFooterForPaths = [
    '/messages', 
    '/scan-qr', 
    '/show-qr',
    '/admin',
    '/videos',
  ];
  const shouldHideFooter = hideFooterForPaths.some(path => (pathname || '').startsWith(path));

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  return <LayoutController>{children}</LayoutController>;
}
