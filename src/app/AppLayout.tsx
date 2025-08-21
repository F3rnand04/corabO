'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider, useCorabo } from "@/contexts/CoraboContext";
import { getOrCreateUser } from "@/ai/flows/auth-flow";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

function LayoutController({ children }: { children: React.ReactNode }) {
    const { firebaseUser, isLoadingAuth } = useAuth();
    const { currentUser, setCurrentUser } = useCorabo();
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoadingAuth) return;

        if (firebaseUser) {
            if (!currentUser || currentUser.id !== firebaseUser.uid) {
                setIsLoadingUser(true);
                getOrCreateUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                    emailVerified: firebaseUser.emailVerified,
                }).then(user => {
                    setCurrentUser(user as User);
                    setIsLoadingUser(false);
                }).catch(err => {
                    console.error("Failed to get or create Corabo user:", err);
                    setCurrentUser(null);
                    setIsLoadingUser(false);
                });
            } else {
                 setIsLoadingUser(false);
            }
        } else {
            setCurrentUser(null);
            setIsLoadingUser(false);
        }
    }, [firebaseUser, isLoadingAuth, currentUser, setCurrentUser]);

    const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].some(p => pathname.startsWith(p));
    const isSetupPage = pathname.startsWith('/initial-setup');

    useEffect(() => {
        if (isLoadingAuth || isLoadingUser) return;

        if (!currentUser && !isPublicPage) {
            router.replace('/login');
        } else if (currentUser) {
            if (!currentUser.isInitialSetupComplete && !isSetupPage) {
                router.replace('/initial-setup');
            } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || isSetupPage)) {
                router.replace('/');
            }
        }
    }, [currentUser, isLoadingAuth, isLoadingUser, pathname, router, isPublicPage, isSetupPage]);

    if (isLoadingAuth || isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
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
  const { firebaseUser } = useAuth();
  
  return (
    <CoraboProvider currentUser={null}>
        <LayoutController>
            {children}
        </LayoutController>
    </CoraboProvider>
  );
}
