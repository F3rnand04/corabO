

'use client';

import { useState, TouchEvent, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Send, Plus, Calendar, Wallet, MapPin, ChevronLeft, ChevronRight, ImageIcon, Settings, MessageCircle, Flag, Zap, Megaphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { GalleryImage, Transaction, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ReportDialog } from '@/components/ReportDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Day, type DayProps } from 'react-day-picker';
import { CampaignDialog } from '@/components/CampaignDialog';
import { Badge } from '@/components/ui/badge';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileGallery, getProfileProducts } from '@/ai/flows/profile-flow';


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage, removeGalleryImage, toggleGps, getAgendaEvents, getUserMetrics, transactions } = useCorabo();
  
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
        const galleryData = await getProfileGallery(currentUser.id);
        const sortedGallery = galleryData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGallery(sortedGallery);

        if (currentUser.type === 'provider') {
            const productsData = await getProfileProducts(currentUser.id);
            setProducts(productsData);
        }
        
    } catch (error) {
        console.error("Error loading profile data:", error);
        toast({ variant: 'destructive', title: 'Error al cargar el perfil' });
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if(currentUser){
        loadProfileData();
    }
  }, [currentUser, loadProfileData]);

  const router = useRouter();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isProvider = currentUser.type === 'provider';
  const isProductProvider = isProvider && currentUser.profileSetupData?.offerType === 'product';

  const [starCount, setStarCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [_, setForceRerender] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const agendaEvents = getAgendaEvents(transactions);
  const paymentCommitmentDates = agendaEvents.filter(e => e.type === 'payment').map(e => new Date(e.date));
  const taskDates = agendaEvents.filter(e => e.type === 'task').map(e => new Date(e.date));

  const { reputation, effectiveness, responseTime } = getUserMetrics(currentUser.id, transactions);
  const isNewProvider = responseTime === 'Nuevo';


  const onDayDoubleClick = (day: Date) => {
    const eventOnDay = agendaEvents.find(
      e => new Date(e.date).toDateString() === day.toDateString()
    );
    if (eventOnDay) {
      if (eventOnDay.type === 'payment') {
        router.push('/transactions?view=commitments');
      } else {
        router.push('/transactions?view=pending');
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setForceRerender(Math.random());
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

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
  
  const handleDeleteImage = (imageId: string) => {
    removeGalleryImage(currentUser.id, imageId);
    toast({ title: "Publicación Eliminada", description: "La imagen ha sido eliminada de tu galería." });
    setIsDetailsDialogOpen(false);
    if (currentImageIndex >= (gallery?.length ?? 1) - 1) {
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
      prevIndex === 0 ? (gallery?.length ?? 1) - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === (gallery?.length ?? 1) - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleImageDoubleClick = () => {
    handleStarClick();
  };

  const openDetailsDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsDetailsDialogOpen(true);
  }
  
  const openProductDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };


  const handleStarClick = () => {
    if (isLiked) {
      setStarCount(prev => prev - 1);
    } else {
      setStarCount(prev => prev + 1);
    }
    setIsLiked(prev => !prev);
  };

  const handleShareClick = async () => {
    const currentItem = isProductProvider ? products[0] : (gallery && gallery.length > 0 ? gallery[currentImageIndex] : null);
    if (!currentItem) return;

    const shareData = {
      title: `Mira esto de ${currentUser.name}`,
      text: 'description' in currentItem ? currentItem.description : '',
      url: window.location.href,
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

  const handleCampaignClick = () => {
     if (!currentUser.isTransactionsActive) {
      toast({
        variant: "destructive",
        title: "Registro de Transacciones Inactivo",
        description: "Debes activar tu registro para poder gestionar campañas."
      });
      return;
    }
    setIsCampaignDialogOpen(true);
  }

  const currentImage = gallery?.length > 0 ? gallery[currentImageIndex] : null;
  
  const displayName = currentUser.profileSetupData?.useUsername 
    ? currentUser.profileSetupData.username || currentUser.name 
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-2 max-w-2xl pb-24">
          
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4">
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
                <h1 className="text-lg font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{specialty}</p>
                <div className="flex items-center gap-3 text-sm mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                        <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    {isNewProvider ? (
                        <Badge variant="secondary">Nuevo</Badge>
                    ) : (
                        <>
                            <span>{effectiveness.toFixed(0)}% Efec.</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="font-semibold text-green-600">{responseTime}</span>
                        </>
                    )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                  {!currentUser.isSubscribed && (
                    <Button
                        variant="link"
                        className="text-xs h-auto p-0 text-red-500/90 hover:text-red-500 font-semibold"
                        onClick={() => setIsSubscriptionDialogOpen(true)}
                    >
                        Suscribir
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                      <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Calendar className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <TooltipProvider>
                                <CalendarComponent
                                    mode="multiple"
                                    selected={[...paymentCommitmentDates, ...taskDates]}
                                    onDayDoubleClick={onDayDoubleClick}
                                    disabled={(date) => date < new Date("1900-01-01")}
                                    initialFocus
                                    components={{
                                      Day: (props: DayProps) => {
                                        const eventOnDay = agendaEvents.find(
                                          (e) => new Date(e.date).toDateString() === props.date.toDateString()
                                        );
                                        return (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="relative w-full h-full flex items-center justify-center">
                                                <Day {...props} />
                                                {eventOnDay && (
                                                  <div
                                                    className={cn(
                                                      "absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full",
                                                      eventOnDay.type === 'payment' ? 'bg-yellow-400' : 'bg-blue-400'
                                                    )}
                                                  />
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            {eventOnDay && (
                                              <TooltipContent>
                                                <p>{eventOnDay.description}</p>
                                              </TooltipContent>
                                            )}
                                          </Tooltip>
                                        );
                                      },
                                    }}
                                />
                            </TooltipProvider>
                            <div className="p-2 border-t text-center text-xs text-muted-foreground">
                                Doble clic para ver detalles.
                            </div>
                          </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}><Wallet className="w-5 h-5 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
                          <MapPin className={cn("w-5 h-5 text-muted-foreground", currentUser.isGpsActive && "text-green-500")} />
                      </Button>
                  </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 py-4">
              {isProvider && (
                <Button 
                  variant="outline" 
                  className="rounded-full text-xs h-8 px-4 font-bold"
                  onClick={handleCampaignClick}
                >
                  <Megaphone className="w-4 h-4 mr-2 text-purple-500"/>
                  Gestionar Campañas
                </Button>
              )}
              <Button 
                variant="secondary" 
                className="rounded-full text-xs h-8 px-4 font-bold"
                onClick={handlePromotionClick}
              >
                <Zap className="w-4 h-4 mr-2 text-yellow-500"/>
                Emprende por Hoy
              </Button>
            </div>
          </header>
          
          <main className="space-y-4">
            <Tabs defaultValue={isProductProvider ? 'products' : 'publications'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="products">Catálogo ({isProvider ? products.length : 0})</TabsTrigger>
                 <TabsTrigger value="publications">Publicaciones ({gallery.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products">
                  {isProvider ? (
                    isLoading ? <Skeleton className="h-48 w-full" /> :
                    products.length > 0 ? (
                      <div className='p-2 grid grid-cols-2 sm:grid-cols-3 gap-2'>
                        {products.map(product => (
                            <ProductGridCard 
                                key={product.id} 
                                product={product}
                                onDoubleClick={() => openProductDetailsDialog(product)}
                            />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4 rounded-lg mt-2">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg text-foreground">
                            Tu catálogo está vacío
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Haz clic en el botón (+) en el pie de página para añadir tu primer producto.
                        </p>
                      </div>
                    )
                  ) : <div className="text-center p-8 text-muted-foreground">Esta vista es solo para proveedores.</div>}
              </TabsContent>

              <TabsContent value="publications">
                <Card className="rounded-2xl overflow-hidden shadow-lg mt-2">
                  <CardContent className="p-0">
                    {isLoading ? (
                        <div className="w-full aspect-video flex items-center justify-center bg-muted">
                           <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : gallery.length > 0 && currentImage ? (
                      <>
                        <div 
                          className="relative group cursor-pointer"
                          onTouchStart={onTouchStart}
                          onTouchMove={onTouchMove}
                          onTouchEnd={onTouchEnd}
                          onDoubleClick={handleImageDoubleClick}
                        >
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
                        </div>
                        <div className="p-2 grid grid-cols-3 gap-1">
                          {gallery.map((thumb, index) => (
                            <div 
                              key={index} 
                              className="relative aspect-square cursor-pointer group"
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
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center text-center p-4">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg text-foreground">
                          Tu galería está vacía
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Haz clic en el botón (+) en el pie de página para añadir tu primera publicación.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
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
          gallery={[selectedImage]}
          startIndex={0}
          owner={currentUser}
        />
      )}
      {selectedProduct && (
        <ProductDetailsDialog
            isOpen={isProductDetailsDialogOpen}
            onOpenChange={setIsProductDetailsDialogOpen}
            product={selectedProduct}
        />
      )}
      {isProvider && (
          <CampaignDialog 
            isOpen={isCampaignDialogOpen}
            onOpenChange={setIsCampaignDialogOpen}
          />
      )}
       <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
