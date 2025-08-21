
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

function LayoutController({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoadingUser } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();
    
    useEffect(() => {
        if (isLoadingUser) {
            return; // Espera a que la carga del usuario termine antes de hacer nada.
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        if (currentUser) {
            // Usuario autenticado
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;

            if (!isSetupComplete && !isSetupPage) {
                // Forzar al setup si no está completo y no está ya en la página de setup.
                router.replace('/initial-setup');
            } else if (isSetupComplete && (isPublicPage || isSetupPage)) {
                 // Si ya completó el setup, y está en una página pública o de setup, mandarlo al home.
                if (pathname === '/login' || isSetupPage) {
                    router.replace('/');
                }
            }
        } else {
            // Usuario no autenticado
            if (!isPublicPage) {
                // Si no está en una página pública, redirigir a login.
                router.replace('/login');
            }
        }
    }, [currentUser, isLoadingUser, pathname, router]);
    
    // Mientras se carga el usuario, muestra un loader a pantalla completa.
    // Esto previene cualquier renderizado de contenido protegido o incorrecto.
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Determina si se debe mostrar el layout principal de la aplicación.
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

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, isLoadingAuth } = useAuth();
    
    return (
        <CoraboProvider firebaseUser={firebaseUser} isAuthLoading={isLoadingAuth}>
            <LayoutController>{children}</LayoutController>
        </CoraboProvider>
    );
}
