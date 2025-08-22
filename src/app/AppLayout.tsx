
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';

// Este es el guardián de la aplicación. Su única responsabilidad es decidir
// qué se debe renderizar basándose en el estado de autenticación y perfil del usuario.
function LayoutController({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoadingUser } = useCorabo();
  const router = useRouter();
  const pathname = usePathname();

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/cashier-login'];

  useEffect(() => {
    if (isLoadingUser) {
      return; // No hacer nada mientras se carga el estado del usuario
    }

    const isPublicPath = publicPaths.includes(pathname);
    const isSetupPath = pathname === '/initial-setup';

    if (currentUser) {
      // Si el usuario está logueado pero no ha completado el setup, forzarlo a ir a la página de setup.
      // Esta es la lógica del "muro obligatorio".
      if (!currentUser.isInitialSetupComplete && !isSetupPath) {
        router.replace('/initial-setup');
      }
      // Si el usuario ya completó el setup y está en una página de login o setup, llevarlo al inicio.
      else if (currentUser.isInitialSetupComplete && (isPublicPath || isSetupPath)) {
        router.replace('/');
      }
    } else {
      // Si el usuario no está logueado y la página no es pública, redirigir al login.
      if (!isPublicPath) {
        router.replace('/login');
      }
    }
  }, [currentUser, isLoadingUser, pathname, router]);


  // **Cortafuegos de Renderizado**
  // Muestra un loader a pantalla completa mientras se determina el estado del usuario.
  // Esto previene cualquier renderizado prematuro que cause errores de hidratación.
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay usuario y estamos en una ruta pública, renderiza la página (ej. /login).
  if (!currentUser && publicPaths.includes(pathname)) {
      return <>{children}</>;
  }
  
  // Si hay un usuario pero está en el proceso de setup, renderiza la página de setup.
  if(currentUser && !currentUser.isInitialSetupComplete && pathname === '/initial-setup') {
      return <>{children}</>;
  }

  // Si hay un usuario y ya ha pasado el setup, muestra la app con su layout.
  if (currentUser && currentUser.isInitialSetupComplete) {
       // Oculta el footer en páginas específicas
      const hideFooterForPaths = [
        '/messages', 
        '/scan-qr', 
        '/show-qr',
        '/admin',
        '/videos',
      ];
      const shouldHideFooter = hideFooterForPaths.some(path => pathname.startsWith(path));

      return (
        <>
          <div className="flex-1">{children}</div>
          {!shouldHideFooter && <Footer />}
        </>
      );
  }

  // En cualquier otro caso (como un usuario no logueado tratando de acceder a una ruta protegida
  // mientras la redirección se efectúa), muestra el loader para evitar flashes de contenido.
  return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  return <LayoutController>{children}</LayoutController>;
}
