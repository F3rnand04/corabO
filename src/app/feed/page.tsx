'use client';

import { FeedView } from '@/components/feed/FeedView';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <FeedView />;
}
