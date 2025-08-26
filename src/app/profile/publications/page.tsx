

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import { ProfileGalleryView } from '@/components/ProfileGalleryView';
import type { GalleryImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


export default function PublicationsPage() {
  const router = useRouter();
  const { currentUser, allPublications } = useCorabo();
  const [isLoading, setIsLoading] = useState(true);

  // Filter publications for the current user from the global state
  const gallery = useMemo(() => {
    if (!currentUser) return [];
    return allPublications.filter(p => p.providerId === currentUser.id && p.type !== 'product');
  }, [currentUser, allPublications]);
  
  useEffect(() => {
    // We are now depending on the context for data, so we can set loading to false
    // once the currentUser is available, as the context listener will handle updates.
    if (currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);


  if (!currentUser) {
    return (
        <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
        <ProfileGalleryView
            gallery={gallery}
            owner={currentUser}
            isLoading={isLoading}
        />
    </>
  );
}
