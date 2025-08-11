
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Star, Megaphone, Zap, Plus } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import { ProfileGalleryView } from '@/components/ProfileGalleryView';
import type { GalleryImage, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getProfileGallery } from '@/ai/flows/profile-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/Footer';

// Reusable Profile Header Component
function ProfileHeader() {
  const { currentUser, updateUserProfileImage, getUserMetrics, transactions } = useCorabo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  if (!currentUser) return null;

  const { reputation, effectiveness, responseTime } = getUserMetrics(currentUser.id, transactions);
  const isNewProvider = responseTime === 'Nuevo';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImageUrl = reader.result as string;
        await updateUserProfileImage(currentUser.id, newImageUrl);
        toast({
          title: "¡Foto de Perfil Actualizada!",
          description: "Tu nueva foto de perfil está visible.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handlePromotionClick = () => {
    if (!currentUser.isTransactionsActive) {
      toast({
        variant: "destructive",
        title: "Registro de Transacciones Inactivo",
        description: "Debes activar tu registro de transacciones para poder usar las promociones."
      });
      return;
    }
    router.push('/emprende');
  };

  const displayName = currentUser.profileSetupData?.useUsername
    ? currentUser.profileSetupData.username || currentUser.name
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-2">
      <div className="flex items-center space-x-4">
        <div className="relative shrink-0">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <Avatar className="w-16 h-16 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button size="icon" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full" onClick={handleAvatarClick}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-grow">
          <h1 className="text-lg font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">{specialty}</p>
          <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
            </div>
            <div className="w-px h-3 bg-border mx-1"></div>
            {isNewProvider ? (
              <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
            ) : (
              <>
                <span>{effectiveness.toFixed(0)}% Efec.</span>
                <div className="w-px h-3 bg-border mx-1"></div>
                <span className="font-semibold text-green-600">{responseTime}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Card className="mt-4">
        <CardContent className="p-2 flex justify-end gap-2">
          {currentUser.type === 'provider' && <Button variant="outline" className="flex-1 rounded-full text-xs h-8 px-4 font-bold"><Megaphone className="w-4 h-4 mr-2 text-purple-500" />Gestionar Campañas</Button>}
          <Button variant="secondary" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handlePromotionClick}><Zap className="w-4 h-4 mr-2 text-yellow-500" />Emprende por Hoy</Button>
        </CardContent>
      </Card>
       <div className="flex justify-around font-semibold text-center border-b mt-2">
          <Button variant="ghost" className="flex-1 p-3 rounded-none text-primary border-b-2 border-primary" onClick={() => router.push('/profile/publications')}>
              Publicaciones {currentUser.gallery?.length || 0}
          </Button>
          {currentUser.type === 'provider' && (
              <Button variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground" onClick={() => router.push('/profile')}>
                  Catálogo 0
              </Button>
          )}
      </div>
    </header>
  );
}


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
       <div className="container mx-auto px-0 md:px-2 max-w-2xl pb-24">
          <ProfileHeader />
          <main className="flex-grow py-4">
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
      <Footer />
    </div>
  );
}
