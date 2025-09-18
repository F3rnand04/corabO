
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

  if (!currentUser) {
    return <LoginPage />;
  }

  // The AppLayout will handle redirection to /initial-setup if needed.
  // We can safely render the feed here if a user object exists.
  return <FeedClientComponent />;
}
