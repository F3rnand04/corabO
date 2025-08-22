
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
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
    
    // --- **DIAGNOSTIC FIX** ---
    // Use a state to track if we are on the client and ready to render conditional UI.
    const [isClientReady, setIsClientReady] = useState(false);

    // This effect runs only on the client, after the initial render.
    useEffect(() => {
        setIsClientReady(true);
    }, []);
    // --- **END DIAGNOSTIC FIX** ---
    
    const isAppLoading = isLoadingAuth || isLoadingUser;

    useEffect(() => {
        // **DIAGNOSTIC FIX**: Defer redirection logic until the client is ready.
        // This ensures that server and client render the same thing initially (the loader).
        if (isAppLoading || !isClientReady) {
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
    }, [currentUser, isAppLoading, pathname, router, isClientReady]);
    
    // If the app is loading OR we're on the server (where isClientReady is false), show a loader.
    // This guarantees the server render and initial client render are identical.
    if (isAppLoading || !isClientReady) {
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
