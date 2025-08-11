
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import { ProfileGalleryView } from '@/components/ProfileGalleryView';
import type { GalleryImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getProfileGallery } from '@/ai/flows/profile-flow';


export default function PublicationsPage() {
  const router = useRouter();
  const { currentUser } = useCorabo();
  const { toast } = useToast();

  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGallery = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Correctly call the Genkit flow to get the gallery posts.
      const galleryData = await getProfileGallery({ userId: currentUser.id, limitNum: 50 });
      setGallery(galleryData.gallery);
    } catch (error) {
      console.error("Error loading gallery:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar tu galería de publicaciones.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
        {isLoading ? (
            <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <ProfileGalleryView
            gallery={gallery}
            owner={currentUser}
            isLoading={isLoading}
            />
        )}
    </>
  );
}
