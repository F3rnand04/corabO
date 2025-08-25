
'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';

// This is now a simple layout wrapper without any loading logic.
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideFooterForPaths = [
    '/messages', 
    '/scan-qr', 
    '/show-qr',
    '/admin',
    '/videos',
  ];
  const shouldHideFooter = hideFooterForPaths.some(path => (pathname || '').startsWith(path));

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">{children}</div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
