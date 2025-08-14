
'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchGallery = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const result = await getProfileGallery({ userId: currentUser.id });
        setGallery(result.gallery || []);
      } catch (error) {
        console.error("Error fetching profile gallery:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar la galería",
          description: "No se pudieron obtener las publicaciones. Inténtalo de nuevo.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGallery();
  }, [currentUser, toast]);


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
