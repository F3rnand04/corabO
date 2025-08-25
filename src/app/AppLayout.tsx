
'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    // No hacer nada mientras el estado de autenticación o el perfil se está resolviendo.
    // Esto previene redirecciones prematuras antes de tener la información completa.
    if (isLoadingAuth || isLoadingUser) {
      return; 
    }

    const currentPath = pathname || '';
    const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
    const isSetupPath = currentPath === '/initial-setup';

    if (firebaseUser) {
      // Si el usuario de Firebase existe, pero el perfil de Corabo aún no se ha cargado, esperamos.
      if (!currentUser) return;

      // Si el usuario está logueado...
      // ...pero no ha completado el setup, forzarlo a ir a la página de setup.
      // Esta es la lógica del "muro obligatorio".
      if (!currentUser.isInitialSetupComplete && !isSetupPath) {
        router.replace('/initial-setup');
      } 
      // ...y ya completó el setup y está en una página pública o de setup, llevarlo al inicio.
      else if (currentUser.isInitialSetupComplete && (isPublicPath || isSetupPath)) {
        router.replace('/');
      }
    } else {
      // Si el usuario no está logueado y la página no es pública, redirigir al login.
      if (!isPublicPath) {
        router.replace('/login');
      }
    }
  }, [firebaseUser, currentUser, isLoadingAuth, isLoadingUser, pathname, router]);


  // **Cortafuegos de Renderizado**
  // Muestra un loader a pantalla completa mientras se determina el estado del usuario.
  // Esto previene cualquier renderizado prematuro que cause errores de hidratación.
  if (isLoadingAuth || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay usuario y estamos en una ruta pública, renderiza la página (ej. /login).
  const isAllowedPublic = !firebaseUser && publicPaths.some(path => (pathname || '').startsWith(path));
  if (isAllowedPublic) {
      return <>{children}</>;
  }
  
  // Si hay usuario pero no perfil (en el breve instante de carga), mostramos loader.
  if(firebaseUser && !currentUser) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Si hay un usuario pero está en el proceso de setup, permite renderizar la página de setup.
  const isAllowedSetup = currentUser && !currentUser.isInitialSetupComplete && (pathname === '/initial-setup');
  if(isAllowedSetup) {
      return <>{children}</>;
  }

  // Si hay un usuario y ya ha pasado el setup, muestra la app con su layout.
  const isAppReady = currentUser && currentUser.isInitialSetupComplete;
  if (isAppReady) {
       // Oculta el footer en páginas específicas
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

  // En cualquier otro caso (como un usuario no logueado tratando de acceder a una ruta protegida
  // mientras la redirección se efectúa, o un usuario que necesita setup mientras es redirigido), 
  // muestra el loader para evitar flashes de contenido incorrecto.
  return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  return <LayoutController>{children}</LayoutController>;
}
