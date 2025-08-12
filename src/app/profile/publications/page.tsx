

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
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Directly use the gallery from the currentUser object
  const gallery = useMemo(() => {
    if (!currentUser) return [];
    return allPublications
      .filter(p => p.providerId === currentUser.id && p.type !== 'product')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentUser, allPublications]);


  useEffect(() => {
    // We are no longer fetching, just checking if the currentUser is loaded.
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
