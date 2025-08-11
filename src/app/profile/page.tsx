
'use client';

import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Send, Plus, Wallet, Megaphone, Settings, ImageIcon, ChevronLeft, ChevronRight, MessageCircle, Flag, Zap, Loader2, Package, LayoutGrid, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { GalleryImage, Transaction, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { CampaignDialog } from '@/components/CampaignDialog';
import { Badge } from '@/components/ui/badge';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileProducts } from '@/ai/flows/profile-flow';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import { ProfileGalleryView } from '@/components/ProfileGalleryView';
import Link from 'next/link';


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage, getUserMetrics, transactions } = useCorabo();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'publications' | 'catalog'>('publications');

  const loadProfileData = useCallback(async () => {
    if (!currentUser?.id) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const isProductProvider = currentUser.type === 'provider' && currentUser.profileSetupData?.offerType === 'product';

    try {
        if (isProductProvider) {
            const { products: newProducts } = await getProfileProducts({ userId: currentUser.id, limitNum: 50 });
            setProducts(newProducts);
        }
        
        setActiveTab(isProductProvider ? 'catalog' : 'publications');

    } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu perfil.' });
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isProvider = currentUser.type === 'provider';
  const isProductProvider = isProvider && currentUser.profileSetupData?.offerType === 'product';
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
  
  const openProductDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
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
  
  const displayName = currentUser.profileSetupData?.useUsername 
    ? currentUser.profileSetupData.username || currentUser.name 
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';

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
              {!currentUser.isSubscribed && (
                <Button variant="link" className="text-xs h-auto p-0 text-red-500/90 hover:text-red-500 font-semibold" onClick={() => setIsSubscriptionDialogOpen(true)}>
                    Suscribir
                </Button>
              )}
            </div>
            
             <Card className="mt-4">
                <CardContent className="p-2 flex justify-end gap-2">
                    {isProvider && <Button variant="outline" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handleCampaignClick}><Megaphone className="w-4 h-4 mr-2 text-purple-500"/>Gestionar Campañas</Button>}
                    <Button variant="secondary" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handlePromotionClick}><Zap className="w-4 h-4 mr-2 text-yellow-500"/>Emprende por Hoy</Button>
                </CardContent>
            </Card>

            <div className="flex justify-around font-semibold text-center border-b mt-2">
                <Button
                    variant="ghost"
                    className={cn(
                    "flex-1 p-3 rounded-none",
                    activeTab === 'publications' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                    onClick={() => router.push('/profile/publications')}
                >
                   {`Publicaciones ${currentUser.gallery?.length || 0}`}
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
                        {isProductProvider ? `Catálogo ${products.length}` : `Trabajos 0`}
                    </Button>
                )}
            </div>

          </header>

          <main className="space-y-4 mt-4">
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
            {activeTab === 'publications' && (
              <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4 rounded-lg">
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg text-foreground">Tu galería está vacía</h3>
                <p className="text-muted-foreground text-sm">Haz clic en el botón (+) en el pie de página para añadir tu primera publicación.</p>
              </div>
            )}
          </main>
        </div>
      </div>
      {isProvider && <CampaignDialog isOpen={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen} />}
      <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
      {selectedProduct && (
        <ProductDetailsDialog
            isOpen={isProductDetailsDialogOpen}
            onOpenChange={setIsProductDetailsDialogOpen}
            product={selectedProduct}
        />
      )}
    </>
  );
}
