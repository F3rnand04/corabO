
'use client';

import { FeedClientComponent } from '@/components/FeedClientComponent';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import LoginPage from './login/page';

export default function HomePage() {
  const { isLoadingAuth, currentUser } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !currentUser.isInitialSetupComplete) {
    // The AppLayout should redirect to /initial-setup if needed,
    // but we show the LoginPage as a fallback if no user is present.
    return <LoginPage />;
  }
  
  // If the user is fully authenticated and setup is complete, show the feed.
  return <FeedClientComponent />;
}
