
'use client';

import { useState, TouchEvent, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Send, Plus, Calendar, Wallet, MapPin, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import { PromotionDialog } from '@/components/PromotionDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { GalleryImage } from '@/lib/types';


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage } = useCorabo();
  
  const [gallery, setGallery] = useState<GalleryImage[]>(currentUser.gallery || []);

  const [providerProfile, setProviderProfile] = useState({
    name: currentUser.name,
    specialty: "Especialidad",
    rating: 4.9,
    efficiency: "99.9%",
    completedJobs: 15,
    otherStat: "00 | 05",
    shareCount: 4567,
    starCount: 8934.5,
    messageCount: 8900,
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [_, setForceRerender] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setGallery(currentUser.gallery || []);
    setProviderProfile(prev => ({...prev, name: currentUser.name}));
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setForceRerender(Math.random());
    }, 1000 * 60); // Rerender every minute to update promotion time
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newImageUrl = reader.result as string;
            const newGalleryImage: GalleryImage = {
                src: newImageUrl,
                alt: `Imagen de ${currentUser.name}`,
                description: "Nueva imagen cargada.",
            };
            const updatedGallery = [newGalleryImage, ...gallery];
            
            updateUserProfileImage(currentUser.id, newImageUrl, updatedGallery);

            toast({
                title: "¡Imagen Actualizada!",
                description: "Tu nueva imagen ya está en tu vitrina y tu perfil ha sido actualizado.",
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? gallery.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === gallery.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleImageDoubleClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsDetailsDialogOpen(true);
  };

  const handlePromotionTabClick = () => {
    setIsPromotionDialogOpen(true);
  };

  const handleActivatePromotion = (promotionText: string) => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newGallery = [...gallery];
    newGallery[currentImageIndex].promotion = {
        text: promotionText,
        expires: expiryDate.toISOString(),
    };
    updateUserProfileImage(currentUser.id, currentUser.profileImage, newGallery);
    
    setIsPromotionDialogOpen(false);
  };

  const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;
  const isPromotionActive = currentImage?.promotion && new Date(currentImage.promotion.expires) > new Date();

  const getPromotionTimeRemaining = () => {
    if (!isPromotionActive || !currentImage?.promotion) return "";
    const diff = new Date(currentImage.promotion.expires).getTime() - new Date().getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Activa (${hours}h ${minutes}m restantes)`;
  };

  if (!currentUser || !currentImage) {
      return (
        <main className="container py-8">
            <h1 className="text-3xl font-bold">Cargando perfil...</h1>
        </main>
      );
  }


  return (
    <>
      <div className="bg-background min-h-screen">
        <main className="container mx-auto py-4 px-2 space-y-4 max-w-2xl pb-24">
          
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="relative shrink-0">
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              <Avatar className="w-16 h-16 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={currentUser.profileImage} alt={currentUser.name} data-ai-hint="user profile photo"/>
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
               <Button 
                size="icon" 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground"
                onClick={handleAvatarClick}
               >
                 <Plus className="w-4 h-4" />
               </Button>
            </div>
            <div className="flex-grow">
              <h1 className="text-lg font-bold text-foreground">{providerProfile.name}</h1>
              <p className="text-sm text-muted-foreground">{providerProfile.specialty}</p>
              <div className="flex items-center gap-3 text-sm mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                      <span className="font-semibold text-foreground">{providerProfile.rating.toFixed(1)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{providerProfile.efficiency} Efec.</span>
                   <Separator orientation="vertical" className="h-4" />
                  <span>{providerProfile.otherStat}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Calendar className="w-5 h-5 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon"><Wallet className="w-5 h-5 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon"><MapPin className="w-5 h-5 text-green-500" /></Button>
            </div>
          </div>

          <div className="flex justify-around text-center text-xs text-muted-foreground -mt-2">
            <div className="flex-1">
                  <p className="font-semibold text-foreground">{gallery.length}</p>
                  <p>Publicaciones</p>
            </div>
              <div className="flex-1">
                  <p className="font-semibold text-foreground">{providerProfile.completedJobs}</p>
                  <p>Trab. Realizados</p>
              </div>
          </div>


          {/* Campaign Management Button */}
          <div className="flex justify-end">
            <Button variant="secondary" className="rounded-full text-xs h-8 px-4 font-bold">
              GESTIÓN DE CAMPAÑAS
            </Button>
          </div>

          {/* Main Content Card */}
          <Card className="rounded-2xl overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {/* Main Image */}
              <div 
                className="relative group"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchEnd}
                onDoubleClick={() => handleImageDoubleClick(currentImage)}
              >
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  width={600}
                  height={400}
                  className="rounded-t-2xl object-cover w-full aspect-[4/3] transition-opacity duration-300 cursor-pointer"
                  data-ai-hint="professional workspace"
                  key={currentImage.src} 
                />
                 {isPromotionActive && currentImage.promotion && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                        {currentImage.promotion.text}
                    </div>
                 )}
                <Button 
                    onClick={handlePrev}
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1/3 left-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden md:flex group-hover:flex"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                    onClick={handleNext}
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1/3 right-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden md:flex group-hover:flex"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
                
                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                    <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                            <Star className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold mt-1 drop-shadow-md">{(providerProfile.starCount / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                            <MessageCircle className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold mt-1 drop-shadow-md">{(providerProfile.messageCount / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                            <Send className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold mt-1 drop-shadow-md">{(providerProfile.shareCount / 1000).toFixed(1)}k</span>
                    </div>
                </div>

              </div>

              {/* Tabs */}
              <div className="flex justify-around font-semibold text-center border-b">
                <div
                  className={cn(
                    "flex-1 p-3 cursor-pointer",
                    isPromotionActive ? "text-green-600 border-b-2 border-green-600" : "border-b-2 border-primary text-primary"
                  )}
                  onClick={handlePromotionTabClick}
                >
                  {isPromotionActive ? getPromotionTimeRemaining() : "Promoción del Día"}
                </div>
                <div
                  className="flex-1 p-3 cursor-pointer text-muted-foreground"
                  onClick={() => handleImageDoubleClick(currentImage)}
                >
                  Editar Descripción
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="p-4 grid grid-cols-3 gap-2">
                  {gallery.map((thumb, index) => (
                      <div 
                          key={index} 
                          className="relative aspect-square cursor-pointer group"
                          onClick={() => setCurrentImageIndex(index)}
                          onDoubleClick={() => handleImageDoubleClick(thumb)}
                      >
                      <Image
                          src={thumb.src}
                          alt={thumb.alt}
                          fill
                          className={cn(
                              "rounded-lg object-cover transition-all duration-200",
                              currentImageIndex === index 
                                  ? "ring-2 ring-primary ring-offset-2" 
                                  : "ring-0 group-hover:opacity-80"
                          )}
                          data-ai-hint="product image"
                      />
                       {thumb.promotion && new Date(thumb.promotion.expires) > new Date() && (
                         <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-sm shadow-lg">
                           PROMO
                         </div>
                       )}
                      </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      {selectedImage && (
        <ImageDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          image={selectedImage}
          isOwnerView={true}
        />
      )}
      <PromotionDialog
        isOpen={isPromotionDialogOpen}
        onOpenChange={setIsPromotionDialogOpen}
        onActivate={handleActivatePromotion}
        image={currentImage}
        isPromotionActive={!!isPromotionActive}
      />
    </>
  );
}
