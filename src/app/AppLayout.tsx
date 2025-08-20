
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoraboProvider } from "@/contexts/CoraboContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].some(p => pathname.startsWith(p));
  const isSetupPage = pathname.startsWith('/initial-setup');

  useEffect(() => {
    if (!currentUser && !isPublicPage) {
      router.replace('/login');
    } else if (currentUser) {
      if (!currentUser.isInitialSetupComplete && !isSetupPage) {
        router.replace('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || isSetupPage)) {
        router.replace('/');
      }
    }
  }, [currentUser, pathname, router, isPublicPage, isSetupPage]);

  // Determine if the full app layout should be shown
  const showAppLayout = currentUser && !isPublicPage;

  return (
    <CoraboProvider currentUser={currentUser}>
      {showAppLayout ? (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-32 pb-16">{children}</main>
          <Footer />
        </div>
      ) : (
        // For public or setup pages, just render the children
        children
      )}
    </CoraboProvider>
  );
}
