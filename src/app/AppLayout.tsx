
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider, useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";

// Lista de rutas que no requieren autenticación.
const PUBLIC_PAGES = [
  '/login',
  '/cashier-login',
  '/policies',
  '/terms',
  '/privacy',
  '/community-guidelines',
];

// Este componente es el cerebro que controla las redirecciones y la visibilidad del layout.
// Su lógica ahora implementa el principio de "Activación Progresiva".
function LayoutController({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoadingUser } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();
    
    useEffect(() => {
        // No tomar ninguna decisión de redirección hasta que el estado del usuario esté 100% resuelto.
        if (isLoadingUser) {
            return;
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        if (currentUser) {
            // **REGLA #1: El "Muro de Configuración"**
            // Si el setup inicial NO está completo, se le fuerza a ir a la página de configuración. No hay escape.
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;
            if (!isSetupComplete && !isSetupPage) {
                router.replace('/initial-setup');
                return; // Detiene la ejecución para evitar otras reglas.
            }
            
            // **REGLA #2: Escape del Usuario Configurado**
            // Si el setup está completo y el usuario intenta acceder a login o a la página de setup, se le envía al inicio.
            if (isSetupComplete && (pathname === '/login' || isSetupPage)) {
                router.replace('/');
            }

        } else {
            // **REGLA #3: El Usuario Anónimo**
            // Si intenta acceder a una ruta protegida sin ser usuario, se le envía al login.
            if (!isPublicPage) {
                router.replace('/login');
            }
        }
    }, [currentUser, isLoadingUser, pathname, router]);
    
    // **Mecanismo de Sincronización CRÍTICO:**
    // Mientras el estado de autenticación y de usuario se esté verificando, se muestra un loader a pantalla completa.
    // Esto previene cualquier renderizado prematuro y asegura que el servidor y el cliente estén sincronizados
    // ANTES de decidir qué página mostrar, eliminando así el error de hidratación.
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Determina si se debe mostrar el layout principal de la app (Header/Footer).
    // Esto solo ocurre si hay un usuario y la página NO es pública.
    const showAppLayout = currentUser && !PUBLIC_PAGES.some(p => pathname.startsWith(p)) && !pathname.startsWith('/initial-setup');

    return (
        <div className="flex flex-col min-h-screen">
            {showAppLayout && <Header />}
            <main className={showAppLayout ? "flex-1 pt-32 pb-16" : "flex-1"}>
                {children}
            </main>
            {showAppLayout && <Footer />}
        </div>
    );
}

// El componente AppLayout ahora es más simple.
// Su única responsabilidad es orquestar los proveedores de contexto.
export function AppLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, isLoadingAuth } = useAuth();
    
    return (
        // 1. CoraboProvider recibe el estado de Firebase.
        <CoraboProvider firebaseUser={firebaseUser} isAuthLoading={isLoadingAuth}>
            {/* 2. LayoutController recibe el estado de Corabo y decide qué renderizar. */}
            <LayoutController>{children}</LayoutController>
        </CoraboProvider>
    );
}
