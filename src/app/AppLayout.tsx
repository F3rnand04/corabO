
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
        // No hacer nada si aún estamos determinando el estado del usuario.
        if (isLoadingUser) {
            return;
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        // Si estamos en una página pública, no aplicamos lógica de redirección aquí.
        // La página de login o registro se encargará de redirigir si el usuario ya tiene sesión.
        if (isPublicPage) {
            return;
        }

        if (currentUser) {
            // Usuario autenticado, pero fuera de las páginas públicas.
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;

            if (!isSetupComplete && !isSetupPage) {
                // Si no ha completado el setup, forzarlo a la página de configuración.
                router.replace('/initial-setup');
            }
        } else {
            // Usuario no autenticado y no está en una página pública, redirigir a login.
            router.replace('/login');
        }
    }, [currentUser, isLoadingUser, pathname, router]);
    
    // Mientras se carga el usuario y no estamos en una página pública, muestra un loader.
    // Esto previene el parpadeo y asegura que no se renderice contenido protegido.
    if (isLoadingUser && !PUBLIC_PAGES.some(p => pathname.startsWith(p))) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Determina si se debe mostrar el layout principal de la aplicación.
    // Solo se muestra si el usuario está autenticado y no está en una página pública.
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
