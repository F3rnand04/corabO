
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import { ProfileGalleryView } from '@/components/ProfileGalleryView';
import type { GalleryImage, User } from '@/lib/types';
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Publicaciones</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>
      <main className="flex-grow container max-w-2xl mx-auto py-4">
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
      </main>
    </div>
  );
}
