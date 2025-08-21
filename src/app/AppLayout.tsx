
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
            return; // Wait for user status to be resolved
        }

        const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
        const isSetupPage = pathname.startsWith('/initial-setup');
        
        if (currentUser) {
            // User is authenticated
            const isSetupComplete = currentUser.isInitialSetupComplete ?? false;

            if (!isSetupComplete && !isSetupPage) {
                // Force setup if not complete and not already on a setup page.
                router.replace('/initial-setup');
            } else if (isSetupComplete && (isPublicPage || isSetupPage)) {
                 // If setup is complete and user is on a public/setup page, send to home.
                if (pathname === '/login' || isSetupPage) {
                    router.replace('/');
                }
            }
        } else {
            // User is not authenticated
            if (!isPublicPage) {
                // If not on a public page, redirect to login.
                router.replace('/login');
            }
        }
    }, [currentUser, isLoadingUser, pathname, router]);
    
    // While loading user status, show a full-screen loader.
    // This is the key to preventing hydration errors and redirect loops.
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Determine if the main app layout (Header/Footer) should be shown.
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
