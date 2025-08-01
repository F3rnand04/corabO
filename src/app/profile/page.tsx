
'use client';

import { useState, TouchEvent, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Send, Plus, Calendar, Wallet, MapPin, ChevronLeft, ChevronRight, ImageIcon, Settings, MessageCircle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import { PromotionDialog } from '@/components/PromotionDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { GalleryImage, Transaction } from '@/lib/types';
import ProfileFooter from '@/components/ProfileFooter';
import { useRouter } from 'next/navigation';
import { ReportDialog } from '@/components/ReportDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage, removeGalleryImage, toggleGps, isGpsActive, transactions } = useCorabo();
  const router = useRouter();
  
  const [gallery, setGallery] = useState<GalleryImage[]>(currentUser.gallery || []);

  const isProvider = currentUser.type === 'provider';

  // Local state for interactions
  const [starCount, setStarCount] = useState(8934);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(4567);
  const [messageCount, setMessageCount] = useState(1234);

  const [providerProfile, setProviderProfile] = useState({
    name: currentUser.name,
    specialty: currentUser.profileSetupData?.specialty || "Especialidad",
    rating: currentUser.reputation || 4.9,
    efficiency: "99.9%",
    completedJobs: 15,
    otherStat: "00 | 05",
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [_, setForceRerender] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentCommitmentDates = transactions
    .filter((tx: Transaction) => (tx.providerId === currentUser.id || tx.clientId === currentUser.id) && tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución')
    .map((tx: Transaction) => new Date(tx.date));


  useEffect(() => {
    setGallery(currentUser.gallery || []);
    setProviderProfile(prev => ({
        ...prev, 
        name: currentUser.profileSetupData?.useUsername ? currentUser.profileSetupData?.username || currentUser.name : currentUser.name,
        specialty: currentUser.profileSetupData?.specialty || "Especialidad"
    }));
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
            updateUserProfileImage(currentUser.id, newImageUrl);

            toast({
                title: "¡Foto de Perfil Actualizada!",
                description: "Tu nueva foto de perfil está visible.",
            });
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleDeleteImage = (imageId: string) => {
    removeGalleryImage(currentUser.id, imageId);
    setIsDetailsDialogOpen(false);
    // Reset index if needed
    if (currentImageIndex >= (currentUser.gallery?.length ?? 1) - 1) {
      setCurrentImageIndex(0);
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
  
  const handleImageDoubleClick = () => {
    handleStarClick();
  };

  const openDetailsDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsDetailsDialogOpen(true);
  }

  const handleStarClick = () => {
    if (isLiked) {
      setStarCount(prev => prev - 1);
    } else {
      setStarCount(prev => prev + 1);
    }
    setIsLiked(prev => !prev);
  };

  const handleShareClick = async () => {
    const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;
    if (!currentImage) return;

    const shareData = {
      title: `Mira esta publicación de ${currentUser.name}`,
      text: `${currentImage.alt}: ${currentImage.description}`,
      url: window.location.href, // Shares the URL of the current profile page
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareCount(prev => prev + 1);
      } else {
        throw new Error("Share API not supported");
      }
    } catch (error) {
       navigator.clipboard.writeText(shareData.url);
       toast({
         title: "Enlace Copiado",
         description: "El enlace al perfil ha sido copiado a tu portapapeles.",
       });
    }
  }


  const handlePromotionTabClick = () => {
    if (!isProvider) return;
    if(gallery.length > 0) {
      setIsPromotionDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "No hay imágenes",
        description: "Añade una imagen a tu galería para poder promocionarla."
      })
    }
  };

  const handleActivatePromotion = (promotionText: string) => {
    if (!isProvider) return;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newGallery = [...gallery];
    newGallery[currentImageIndex].promotion = {
        text: promotionText,
        expires: expiryDate.toISOString(),
    };
    // This part is tricky. We are modifying a copy of the user's gallery
    // but we need a way to persist this back to the main user state in the context.
    // For now, let's just update the local state to see the effect.
    // A proper implementation would call a function from the context like `updateUserGallery`.
    setGallery(newGallery);
    
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

  if (!currentUser) {
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
              <Avatar className={cn("w-16 h-16 cursor-pointer")} onClick={handleAvatarClick}>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="multiple"
                      selected={paymentCommitmentDates}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                     <div className="p-2 border-t text-center text-xs text-muted-foreground">
                        Días con compromisos de pago resaltados.
                     </div>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}><Wallet className="w-5 h-5 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleGps} onDoubleClick={() => router.push('/map')}>
                    <MapPin className={cn("w-5 h-5 text-muted-foreground", isGpsActive && "text-green-500")} />
                </Button>
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
             <Button 
              variant="secondary" 
              className="rounded-full text-xs h-8 px-4 font-bold"
              disabled={!isProvider}
            >
              GESTIÓN DE CAMPAÑAS
            </Button>
          </div>

          {/* Main Content Card */}
          <Card className="rounded-2xl overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {/* Main Image */}
              <div 
                className="relative group cursor-pointer"
                onTouchStart={gallery.length > 0 ? onTouchStart : undefined}
                onTouchMove={gallery.length > 0 ? onTouchMove : undefined}
                onTouchEnd={gallery.length > 0 ? onTouchEnd : undefined}
                onDoubleClick={currentImage ? handleImageDoubleClick : undefined}
              >
                {currentImage ? (
                  <>
                    <Image
                      src={currentImage.src}
                      alt={currentImage.alt}
                      width={600}
                      height={400}
                      className="rounded-t-2xl object-cover w-full aspect-[4/3] transition-opacity duration-300"
                      data-ai-hint="professional workspace"
                      key={currentImage.src} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 left-2 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsReportDialogOpen(true)}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                    {isProvider && isPromotionActive && currentImage.promotion && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                            {currentImage.promotion.text}
                        </div>
                    )}
                    <Button 
                        onClick={handlePrev}
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden md:flex group-hover:flex"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                        onClick={handleNext}
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden md:flex group-hover:flex"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    
                     <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                      <div className="flex flex-col items-center">
                          <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleStarClick}>
                              <Star className={cn("w-5 h-5", isLiked && "fill-yellow-400 text-yellow-400")} />
                          </Button>
                          <span className="text-xs font-bold mt-1 drop-shadow-md">{(starCount / 1000).toFixed(1)}k</span>
                      </div>
                       <div className="flex flex-col items-center">
                          <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={() => openDetailsDialog(currentImage)}>
                              <MessageCircle className="w-5 h-5" />
                          </Button>
                          <span className="text-xs font-bold mt-1 drop-shadow-md">{(messageCount / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleShareClick}>
                              <Send className="w-5 h-5" />
                          </Button>
                          <span className="text-xs font-bold mt-1 drop-shadow-md">{shareCount}</span>
                      </div>
                  </div>
                  </>
                ) : (
                   <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center text-center p-4">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg text-foreground">
                          Tu vitrina está vacía
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Haz clic en el botón (+) en el pie de página para añadir tu primera publicación.
                        </p>
                   </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex justify-around font-semibold text-center border-b">
                <div
                  className={cn(
                    "flex-1 p-3 cursor-pointer",
                    !isProvider ? "cursor-not-allowed text-muted-foreground/50" : "",
                    isPromotionActive && isProvider
                        ? "text-green-600 border-b-2 border-green-600" 
                        : isProvider 
                            ? "border-b-2 border-primary text-primary" 
                            : "text-muted-foreground"
                  )}
                  onClick={handlePromotionTabClick}
                  aria-disabled={!isProvider}
                >
                  {isPromotionActive && isProvider ? getPromotionTimeRemaining() : "Promoción del Día"}
                </div>
                <div
                  className={cn(
                    "flex-1 p-3 cursor-pointer",
                    !currentImage ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground"
                  )}
                  onClick={() => currentImage && openDetailsDialog(currentImage)}
                >
                  Editar Descripción
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="p-4 grid grid-cols-3 gap-2">
                  {gallery.length > 0 ? (
                    gallery.map((thumb, index) => (
                        <div 
                            key={index} 
                            className="relative aspect-square group cursor-pointer"
                            onClick={() => setCurrentImageIndex(index)}
                            onDoubleClick={() => openDetailsDialog(thumb)}
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
                         {isProvider && thumb.promotion && new Date(thumb.promotion.expires) > new Date() && (
                           <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-sm shadow-lg">
                             PROMO
                           </div>
                         )}
                        </div>
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-muted-foreground py-8">
                      No hay publicaciones en tu galería.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </main>
        <ProfileFooter />
      </div>
       <ReportDialog 
            isOpen={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen} 
            providerId={currentUser.id} 
            publicationId={currentImage?.id || 'profile-img'} 
        />
      {selectedImage && (
        <ImageDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          image={selectedImage}
          isOwnerView={true}
          onDelete={handleDeleteImage}
          onCommentSubmit={() => setMessageCount(prev => prev + 1)}
        />
      )}
      {currentImage && isProvider &&
        <PromotionDialog
          isOpen={isPromotionDialogOpen}
          onOpenChange={setIsPromotionDialogOpen}
          onActivate={handleActivatePromotion}
          image={currentImage}
          isPromotionActive={!!isPromotionActive}
        />
      }
    </>
  );
}
