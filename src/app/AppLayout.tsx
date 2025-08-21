
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider, useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/types";


function LayoutController({ children }: { children: React.ReactNode }) {
    // This component now consumes the context
    const { currentUser, isLoadingUser, isInitialSetupComplete } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].some(p => pathname.startsWith(p));
    const isSetupPage = pathname.startsWith('/initial-setup');

    useEffect(() => {
        if (isLoadingUser) return;

        if (!currentUser && !isPublicPage) {
            router.replace('/login');
        } else if (currentUser) {
            if (!isInitialSetupComplete && !isSetupPage) {
                router.replace('/initial-setup');
            } else if (isInitialSetupComplete && (pathname === '/login' || isSetupPage)) {
                router.replace('/');
            }
        }
    }, [currentUser, isLoadingUser, isInitialSetupComplete, pathname, router, isPublicPage, isSetupPage]);

    if (isLoadingUser && !isPublicPage) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // The conditional rendering of the main layout (Header/Footer) now depends on a valid currentUser,
    // not just being outside a public page. This prevents them from showing up briefly before redirection.
    const showAppLayout = currentUser && !isPublicPage;

    return showAppLayout ? (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-32 pb-16">{children}</main>
            <Footer />
        </div>
    ) : (
        children
    );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
         return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  
    // CoraboProvider now wraps the entire layout controller.
    // It is initialized with the firebaseUser, and its internal useEffect
    // will fetch the corresponding Corabo user. This ensures any component
    // inside LayoutController (including Header and Footer) can use useCorabo().
    return (
        <CoraboProvider initialFirebaseUser={firebaseUser}>
            <LayoutController>{children}</LayoutController>
        </CoraboProvider>
    );
}
