'use client';

import { useAuth } from '@/hooks/use-auth';
import { FeedClientComponent } from '@/components/FeedClientComponent';
import LoginPage from './login/page';
import InitialSetupPage from './initial-setup/page';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component is now the main gatekeeper.
export default function HomePage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection for LOGGED-IN users who land here
    // but need to complete their setup.
    if (!isLoadingAuth && currentUser && !currentUser.isInitialSetupComplete) {
      router.push('/initial-setup');
    }
  }, [isLoadingAuth, currentUser, router]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (!currentUser.isInitialSetupComplete) {
    // While the useEffect above redirects, we show a loader to avoid flashing content.
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If fully authenticated and setup is complete, show the main feed.
  return <FeedClientComponent />;
}
