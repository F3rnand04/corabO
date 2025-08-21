
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
function LayoutController({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoadingUser } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();
    
    useEffect(() => {
        // No tomar ninguna decisión de redirección hasta que el estado del usuario esté completamente resuelto.
        if (isLoadingUser) {
            return;
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        if (currentUser) {
            // -- Lógica para usuario AUTENTICADO --
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;

            if (!isSetupComplete && !isSetupPage) {
                // Si el setup no está completo, se le fuerza a ir a la página de configuración.
                router.replace('/initial-setup');
            } else if (isSetupComplete && (pathname === '/login' || isSetupPage)) {
                 // Si el setup está completo y el usuario está en login o setup, se le envía al inicio.
                router.replace('/');
            }
        } else {
            // -- Lógica para usuario NO AUTENTICADO --
            if (!isPublicPage) {
                // Si intenta acceder a una ruta protegida, se le envía al login.
                router.replace('/login');
            }
        }
    }, [currentUser, isLoadingUser, pathname, router]);
    
    // **Blindaje contra errores de hidratación y redirección**:
    // Mientras el estado del usuario se esté verificando, se muestra un loader a pantalla completa.
    // Esto previene cualquier renderizado parcial y asegura que el router no actúe con estado obsoleto.
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Determina si se debe mostrar el layout principal de la app (Header/Footer).
    const showAppLayout = currentUser && !PUBLIC_PAGES.some(p => pathname.startsWith(p));

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
