
'use client';

import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Send, Plus, Wallet, Megaphone, Settings, ImageIcon, ChevronLeft, ChevronRight, MessageCircle, Flag, Zap, Loader2, Package, LayoutGrid, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { GalleryImage, Transaction, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ReportDialog } from '@/components/ReportDialog';
import { CampaignDialog } from '@/components/CampaignDialog';
import { Badge } from '@/components/ui/badge';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileGallery, getProfileProducts } from '@/ai/flows/profile-flow';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage, getAgendaEvents, getUserMetrics, transactions } = useCorabo();
  
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'publications' | 'catalog'>('publications');


  const isProvider = currentUser?.type === 'provider';
  const isProductProvider = isProvider && currentUser?.profileSetupData?.offerType === 'product';

  const loadProfileData = useCallback(async () => {
    if (!currentUser?.id) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
        if (isProductProvider) {
            const { products: newProducts } = await getProfileProducts({ userId: currentUser.id, limitNum: 50 });
            setProducts(newProducts);
        }
        // Always load gallery for publications tab
        const { gallery: newGallery } = await getProfileGallery({ userId: currentUser.id, limitNum: 50 });
        setGallery(newGallery);
        
        // Set default tab
        setActiveTab(isProductProvider ? 'catalog' : 'publications');

    } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu perfil.' });
    } finally {
        setIsLoading(false);
    }
  }, [currentUser?.id, isProductProvider, toast]);

  useEffect(() => {
    if(currentUser){
        loadProfileData();
    }
  }, [currentUser, loadProfileData]);


  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  const [starCount, setStarCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if(gallery.length > 0) {
        const currentImage = gallery[currentImageIndex];
        setStarCount(currentImage.likes || 0);
        setMessageCount(currentImage.comments?.length || 0);
        setShareCount(0); // Reset share count on image change
    }
  }, [currentImageIndex, gallery]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  const openDetailsDialog = (index: number) => {
    setDetailsDialogStartIndex(index);
    setIsDetailsDialogOpen(true);
  };
  
  const openProductDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };
  
  const [detailsDialogStartIndex, setDetailsDialogStartIndex] = useState(0);

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
  
  const handleStarClick = () => {
    setIsLiked(prev => !prev);
    setStarCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShareClick = async () => {
    const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;
    if (!currentImage) return;

    const shareData = {
      title: `Mira esta publicación de ${currentUser.name}`,
      text: `${currentImage.alt}: ${currentImage.description}`,
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
  };
  
  const displayName = currentUser.profileSetupData?.useUsername 
    ? currentUser.profileSetupData.username || currentUser.name 
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';
  const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-2 max-w-2xl pb-24">
          {/* Profile Header */}
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4">
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
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                        <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    {isNewProvider ? (
                        <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
                    ) : (
                        <>
                            <span>{effectiveness.toFixed(0)}% Efec.</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="font-semibold text-green-600">{responseTime}</span>
                        </>
                    )}
                </div>
              </div>
              {!currentUser.isSubscribed && (
                <Button variant="link" className="text-xs h-auto p-0 text-red-500/90 hover:text-red-500 font-semibold" onClick={() => setIsSubscriptionDialogOpen(true)}>
                    Suscribir
                </Button>
              )}
            </div>
            
             <Card className="mt-4">
                <CardContent className="p-0">
                    <div className="flex justify-around font-semibold text-center border-b">
                        <div className="flex-1 p-3">
                            <p className="font-bold">{gallery.length}</p>
                            <p className="text-xs text-muted-foreground">Publicaciones</p>
                        </div>
                        <Separator orientation="vertical" className="h-auto"/>
                        <div className="flex-1 p-3">
                            <p className="font-bold">{isProductProvider ? products.length : 0}</p>
                            <p className="text-xs text-muted-foreground">{isProductProvider ? 'Productos' : 'Trab. Realizados'}</p>
                        </div>
                    </div>
                     <div className="p-2 flex justify-end gap-2">
                        {isProvider && <Button variant="outline" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handleCampaignClick}><Megaphone className="w-4 h-4 mr-2 text-purple-500"/>Gestionar Campañas</Button>}
                        <Button variant="secondary" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handlePromotionClick}><Zap className="w-4 h-4 mr-2 text-yellow-500"/>Emprende por Hoy</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-around font-semibold text-center border-b mt-4">
                <Button
                    variant="ghost"
                    className={cn(
                    "flex-1 p-3 rounded-none",
                    activeTab === 'publications' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                    onClick={() => setActiveTab('publications')}
                >
                   <LayoutGrid className="w-5 h-5" />
                </Button>
                {isProvider && (
                    <Button
                        variant="ghost"
                        className={cn(
                        "flex-1 p-3 rounded-none",
                        activeTab === 'catalog' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                        )}
                        onClick={() => setActiveTab('catalog')}
                    >
                        {isProductProvider ? <Package className="w-5 h-5"/> : <Tag className="w-5 h-5"/>}
                    </Button>
                )}
            </div>

          </header>

          <main className="space-y-4 mt-4">
            {activeTab === 'publications' && (
                <>
                  <Card className="rounded-2xl overflow-hidden shadow-lg relative">
                    <CardContent className="p-0">
                      {isLoading ? (
                          <Skeleton className="w-full aspect-video" />
                      ) : currentImage ? (
                        <div className="relative group" onDoubleClick={() => openDetailsDialog(currentImageIndex)}>
                          <Image src={currentImage.src} alt={currentImage.alt} width={600} height={400} className="rounded-t-2xl object-cover w-full aspect-[4/3] cursor-pointer" data-ai-hint="professional workspace" key={currentImage.src}/>
                          <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-10 text-white bg-black/20 rounded-full h-8 w-8" onClick={() => setIsReportDialogOpen(true)}><Flag className="w-4 h-4" /></Button>
                          <Button onClick={handlePrev} variant="ghost" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/20 text-white rounded-full h-8 w-8 z-10"><ChevronLeft className="h-5 w-5" /></Button>
                          <Button onClick={handleNext} variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/20 text-white rounded-full h-8 w-8 z-10"><ChevronRight className="h-5 w-5" /></Button>
                          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                              <div className="flex flex-col items-center"><Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleStarClick}><Star className={cn("w-5 h-5", isLiked && "fill-yellow-400 text-yellow-400")} /></Button><span className="text-xs font-bold mt-1">{(starCount / 1000).toFixed(1)}k</span></div>
                              <div className="flex flex-col items-center"><Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={() => openDetailsDialog(currentImageIndex)}><MessageCircle className="w-5 h-5" /></Button><span className="text-xs font-bold mt-1">{messageCount}</span></div>
                              <div className="flex flex-col items-center"><Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleShareClick}><Send className="w-5 h-5" /></Button><span className="text-xs font-bold mt-1">{shareCount}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4">
                          <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                          <h3 className="font-bold text-lg text-foreground">Tu galería está vacía</h3>
                          <p className="text-muted-foreground text-sm">Haz clic en el botón (+) en el pie de página para añadir tu primera publicación.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Thumbnail Grid */}
                  <div className="p-2 grid grid-cols-3 gap-1">
                      {isLoading ? (
                          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)
                      ) : (
                          gallery.map((thumb, index) => (
                              <div key={thumb.id} className="relative aspect-square cursor-pointer group" onClick={() => setCurrentImageIndex(index)} onDoubleClick={() => openDetailsDialog(index)}>
                                  <Image src={thumb.src} alt={thumb.alt} fill className={cn("object-cover rounded-md transition-all duration-200", currentImageIndex === index ? "ring-2 ring-primary ring-offset-2" : "ring-0 group-hover:opacity-80")} data-ai-hint="product image" />
                              </div>
                          ))
                      )}
                  </div>
              </>
            )}

             {activeTab === 'catalog' && (
                 <div>
                  {isLoading ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                      </div>
                  ) : products.length > 0 ? (
                    <div className='p-2 grid grid-cols-2 gap-2'>
                      {products.map(product => (
                        <ProductGridCard 
                          key={product.id} 
                          product={product}
                          onDoubleClick={() => openProductDetailsDialog(product)}
                         />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4 rounded-lg">
                        <Package className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg text-foreground">Tu catálogo está vacío</h3>
                        <p className="text-muted-foreground text-sm">Haz clic en el botón (+) en el pie de página para añadir tu primer producto.</p>
                    </div>
                  )}
              </div>
            )}
          </main>
        </div>
      </div>
      <ReportDialog isOpen={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} providerId={currentUser.id} publicationId={currentImage?.id || 'profile-report'} />
      {gallery.length > 0 && <ImageDetailsDialog isOpen={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} gallery={gallery} startIndex={detailsDialogStartIndex} owner={currentUser} />}
       {selectedProduct && (
        <ProductDetailsDialog
            isOpen={isProductDetailsDialogOpen}
            onOpenChange={setIsProductDetailsDialogOpen}
            product={selectedProduct}
        />
      )}
      {isProvider && <CampaignDialog isOpen={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen} />}
      <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
