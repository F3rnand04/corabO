
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider, useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";

const PUBLIC_PAGES = [
  '/login',
  '/cashier-login',
  '/policies',
  '/terms',
  '/privacy',
  '/community-guidelines',
];

// Este componente ahora depende de los dos contextos y orquesta el renderizado.
function LayoutController({ children }: { children: React.ReactNode }) {
    // 1. Obtener los estados de carga de AMBOS contextos.
    const { isLoadingAuth } = useAuth();
    const { currentUser, isLoadingUser } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();
    
    // 2. Determinar el estado de carga general. La app no está lista hasta que AMBOS contextos lo estén.
    const isAppLoading = isLoadingAuth || isLoadingUser;

    useEffect(() => {
        // No tomar ninguna decisión hasta que la app esté completamente cargada.
        if (isAppLoading) {
            return;
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        if (currentUser) {
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;
            if (!isSetupComplete && !isSetupPage) {
                router.replace('/initial-setup');
                return;
            }
            
            if (isSetupComplete && (pathname === '/login' || isSetupPage)) {
                router.replace('/');
            }
        } else {
            if (!isPublicPage) {
                router.replace('/login');
            }
        }
    }, [currentUser, isAppLoading, pathname, router]);
    
    // 3. Mecanismo de Sincronización Definitivo: EL LOADER.
    // Si la app está cargando, se muestra un loader a pantalla completa.
    // Esto previene que se renderice contenido inconsistente y elimina el error de hidratación.
    if (isAppLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
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

// AppLayout ahora es un simple orquestador de proveedores.
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. AuthProvider gestiona el estado de Firebase.
    // 2. CoraboProvider (dentro de él) consume ese estado para obtener el perfil de Corabo.
    // 3. LayoutController (dentro de CoraboProvider) consume AMBOS estados para decidir qué renderizar.
    <CoraboProvider>
        <LayoutController>{children}</LayoutController>
    </CoraboProvider>
  );
}
