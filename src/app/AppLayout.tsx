
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider, useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";

function LayoutController({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoadingUser } = useCorabo();
    const router = useRouter();
    const pathname = usePathname();
    
    const isInitialSetupComplete = currentUser?.isInitialSetupComplete ?? false;
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
    
    // While the user data is loading but we're not on a public page, show a loader.
    if (isLoadingUser && !isPublicPage) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const showAppLayout = currentUser && !isPublicPage;

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
