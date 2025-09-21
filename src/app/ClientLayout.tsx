
'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';
import { CoraboProvider } from '@/contexts/CoraboContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoadingAuth } = useAuth();

  // Show a full-screen loader while the auth state is being determined.
  // This prevents content flashes and ensures we know the user's status before rendering.
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // The logic in AuthProvider handles redirection. If we are here and there's no
  // user, it's either an auth page or a temporary state before redirect.
  // We should not wrap these pages with CoraboProvider or the main layout.
  if (!currentUser) {
      return <>{children}</>;
  }

  // Once we have a user, wrap the main app content with CoraboProvider and the layout.
  const hideHeaderForPaths = [
    '/initial-setup',
    '/cashier-login',
    '/scan-qr',
    '/show-qr',
    '/videos',
    '/profile',
  ];

  const hideFooterForPaths = [
    '/messages', 
    '/scan-qr', 
    '/show-qr',
    '/admin',
    '/videos',
    '/initial-setup',
    '/cashier-login',
  ];

  const shouldHideHeader = hideHeaderForPaths.some(path => (pathname || '').startsWith(path));
  const shouldHideFooter = hideFooterForPaths.some(path => (pathname || '').startsWith(path));
  
  return (
    <CoraboProvider>
      {!shouldHideHeader && <Header />}
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </CoraboProvider>
  );
}
