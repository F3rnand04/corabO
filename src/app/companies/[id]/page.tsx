

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Calendar, MapPin, Bookmark, Send, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, Flag, Package, Hand, ShoppingCart, Plus, Minus, X, Truck, AlertTriangle, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState, TouchEvent, useEffect, useCallback, useMemo } from 'react';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import type { User, GalleryImage, Product, Transaction, AppointmentRequest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from '@/components/ReportDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';
import { ProductGridCard } from '@/components/ProductGridCard';
import { Badge } from '@/components/ui/badge';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { credicoraLevels } from '@/lib/types';
import { ActivationWarning } from '@/components/ActivationWarning';
import { Input } from '@/components/ui/input';
import { getProfileGallery, getProfileProducts } from '@/ai/flows/profile-flow';

export default function CompanyProfilePage() {
  const params = useParams();
  const { addContact, isContact, transactions, createAppointmentRequest, currentUser, cart, updateCartQuantity, getCartTotal, getDeliveryCost, checkout, sendMessage, toggleGps, deliveryAddress, setDeliveryAddress, getUserMetrics, fetchUser, getDistanceToProvider } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const providerId = params.id as string;

  const [provider, setProvider] = useState<User | null>(null);
  const [providerProducts, setProviderProducts] = useState<Product[]>([]);
  const [providerGallery, setProviderGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  useEffect(() => {
    if (!providerId) {
        setIsLoading(false);
        return;
    };
    
    const loadProfileData = async () => {
        setIsLoading(true);
        try {
            const fetchedProvider = await fetchUser(providerId);
            setProvider(fetchedProvider);

            if (fetchedProvider) {
              if (fetchedProvider.profileSetupData?.offerType === 'product') {
                  const productsResult = await getProfileProducts({ userId: providerId });
                  setProviderProducts(productsResult.products || []);
              } else {
                  const galleryResult = await getProfileGallery({ userId: providerId });
                  setProviderGallery(galleryResult.gallery || []);
              }
            }
        } catch (error) {
            console.error("Error loading provider data:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el perfil del proveedor." });
        } finally {
            setIsLoading(false);
        }
    };
    
    loadProfileData();

  }, [providerId, fetchUser, toast]);

  const filteredProducts = useMemo(() => {
    if (!catalogSearchQuery) return providerProducts;
    return providerProducts.filter(p => p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()));
  }, [providerProducts, catalogSearchQuery]);
  
  const isDeliveryOnly = provider?.profileSetupData?.isOnlyDelivery || false;
  const providerAcceptsCredicora = provider?.profileSetupData?.acceptsCredicora || false;
  const isProductProvider = provider?.profileSetupData?.offerType === 'product';
  const isCurrentUserTransactionReady = currentUser?.isTransactionsActive;
  const isProviderTransactionReady = provider?.isTransactionsActive;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsDialogStartIndex, setDetailsDialogStartIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [businessStatus, setBusinessStatus] = useState<'open' | 'closed'>('closed');
  
  const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [useCredicora, setUseCredicora] = useState(false);
  
  const minSwipeDistance = 50;

  const [starCount, setStarCount] = useState(Math.floor(Math.random() * 5000));
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [activeTab, setActiveTab] = useState('comentarios');
  const [gpsReady, setGpsReady] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    setGpsReady(true);
  }, []);

  useEffect(() => {
    if (provider) {
        setIsSaved(isContact(provider.id));
    }
  }, [isContact, provider]);

  useEffect(() => {
      if(isCheckoutAlertOpen && currentUser?.profileSetupData?.location) {
          setDeliveryAddress(currentUser.profileSetupData.location);
      }
  }, [isCheckoutAlertOpen, currentUser?.profileSetupData?.location, setDeliveryAddress])


  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTransaction = cart.length > 0 ? transactions.find(tx => tx.clientId === currentUser?.id && tx.status === 'Carrito Activo') : undefined;


  const handleCheckout = () => {
    if (cartTransaction) {
        checkout(cartTransaction.id, includeDelivery || isDeliveryOnly, useCredicora);
    }
  };
  
  const deliveryCost = getDeliveryCost();
  const subtotal = getCartTotal();
  const totalWithDelivery = subtotal + ((includeDelivery || isDeliveryOnly) ? deliveryCost : 0);

  const userCredicoraLevel = currentUser?.credicoraLevel || 1;
  const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
  const creditLimit = currentUser?.credicoraLimit || 0;

  const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
  const potentialFinancing = subtotal * financingPercentage;
  const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
  const productInitialPayment = subtotal - financedAmount;
  const totalToPayToday = productInitialPayment + ((includeDelivery || isDeliveryOnly) ? deliveryCost : 0);
  const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!provider) {
    return (
      <main className="container py-8 text-center">
        <h1 className="text-3xl font-bold">Perfil no encontrado</h1>
        <p className="text-muted-foreground mt-4">No se pudo encontrar el proveedor que estás buscando.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </main>
    );
  }
  
  const handleDirectMessage = () => {
    if (!provider) return;
    const conversationId = sendMessage(provider.id, '', true);
    router.push(`/messages/${conversationId}`);
  };

  const paymentCommitmentDates = transactions
    .filter(tx => (tx.providerId === provider.id || tx.clientId === provider.id) && tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución')
    .map(tx => new Date(tx.date));


  const disabledDays = Object.entries(provider.profileSetupData?.schedule || {})
    .filter(([, dayDetails]) => !dayDetails.active)
    .map(([dayName]) => {
        const dayMap: { [key: string]: number } = {
            'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
            'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };
        return dayMap[dayName];
    });

    const handleDateSelect = (date: Date | undefined) => {
        if (!isCurrentUserTransactionReady) {
             toast({
                variant: 'destructive',
                title: "Acción Requerida",
                description: "Por favor, activa tu registro de transacciones para poder agendar citas.",
             });
             return;
        }
        if (!isProviderTransactionReady) {
             toast({
                variant: 'destructive',
                title: "Proveedor no disponible",
                description: "Este proveedor no tiene las transacciones activas en este momento.",
             });
             return;
        }
        if (date && provider) {
            setAppointmentDate(date);
            setIsAppointmentDialogOpen(true);
        }
    };

    const handleConfirmAppointment = () => {
        if (appointmentDate && provider && currentUser && isCurrentUserTransactionReady && isProviderTransactionReady) {
            const request: Omit<AppointmentRequest, 'clientId'> = {
                providerId: provider.id,
                date: appointmentDate,
                details: appointmentDetails,
                amount: provider.profileSetupData?.appointmentCost || 0,
            };
            createAppointmentRequest(request);
            setIsAppointmentDialogOpen(false);
            setAppointmentDetails('');
            toast({
                title: "Solicitud de Cita Enviada",
                description: "El proveedor revisará tu solicitud y se pondrá en contacto.",
            });
        }
    };

  const handleMapPinClick = () => {
    if (provider.profileSetupData?.hasPhysicalLocation && provider.profileSetupData?.showExactLocation && provider.profileSetupData?.location) {
        const [lat, lon] = provider.profileSetupData.location.split(',');
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(mapsUrl, '_blank');
    } else {
        toast({
            title: "Ubicación Privada",
            description: "Este proveedor ha decidido no mostrar su ubicación exacta.",
        });
    }
  };


  const gallery: GalleryImage[] = providerGallery || [];
  
  const displayName = provider.profileSetupData?.useUsername 
        ? provider.profileSetupData.username || provider.name 
        : provider.name;
    const specialty = provider.profileSetupData?.specialty || "Especialidad de la Empresa";
  
  const distance = getDistanceToProvider(provider);
  
  const { reputation, effectiveness, responseTime } = getUserMetrics(provider.id, transactions);
  const isNewProvider = responseTime === 'Nuevo';

  const profileData = {
    name: displayName,
    specialty: specialty,
    rating: reputation,
    efficiency: effectiveness,
    responseTime: responseTime,
    publications: gallery.length,
    completedJobs: transactions.filter(t => t.providerId === provider.id && (t.status === 'Pagado' || t.status === 'Resuelto')).length,
    distance: distance,
    profileImage: provider.profileImage,
    mainImage: gallery.length > 0 ? gallery[currentImageIndex].src : "https://placehold.co/600x400.png",
    gallery: gallery
  };

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
    openDetailsDialog(currentImageIndex);
  };
  
  const openDetailsDialog = (index: number) => {
    setDetailsDialogStartIndex(index);
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
    const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;
    if (!currentImage) return;

    const shareData = {
      title: `Mira esta publicación de ${provider.name}`,
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

  const handleSaveContact = () => {
    const success = addContact(provider);
    if (success) {
      toast({
        title: "¡Contacto Guardado!",
        description: `Has añadido a ${provider.name} a tus contactos.`
      });
      setIsSaved(true);
    } else {
        toast({
            title: "Contacto ya existe",
            description: `${provider.name} ya está en tu lista de contactos.`
        });
    }
  };
  
  const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;

  if (!currentUser) return null;

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-0 md:px-2 max-w-2xl pb-24">
          
          <div className="p-2">
            {currentUser.type === 'client' && !isCurrentUserTransactionReady && (
                <ActivationWarning userType="client" />
            )}
            {currentUser.type === 'client' && isCurrentUserTransactionReady && !isProviderTransactionReady && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Proveedor No Disponible para Transacciones</AlertTitle>
                    <AlertDescription>
                        Este proveedor aún no ha activado su registro de transacciones, por lo que no podrás comprar o contratar sus servicios por ahora.
                    </AlertDescription>
                </Alert>
            )}
          </div>

          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-2">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage src={profileData.profileImage} alt={profileData.name} data-ai-hint="company logo"/>
                <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">{profileData.name}</h1>
                  {provider.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{profileData.specialty}</p>
                <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                        <span className="font-semibold text-foreground">{profileData.rating.toFixed(1)}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    {isNewProvider ? (
                        <Badge variant="secondary">Nuevo</Badge>
                    ) : (
                        <>
                            <span>{profileData.efficiency.toFixed(0)}% Efec.</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="font-semibold text-green-600">{profileData.responseTime}</span>
                        </>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!isCurrentUserTransactionReady || !isProviderTransactionReady}>
                        <Calendar className={cn("w-5 h-5", {
                          "text-green-500": businessStatus === 'open',
                          "text-red-500": businessStatus === 'closed'
                        })} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                       <div className="p-3 flex items-center justify-between">
                           <BusinessHoursStatus schedule={provider.profileSetupData?.schedule} onStatusChange={setBusinessStatus} />
                       </div>
                       <Separator />
                      <CalendarComponent
                        mode="single"
                        onSelect={handleDateSelect}
                        disabled={[
                            { dayOfWeek: disabledDays },
                            { before: new Date() },
                        ]}
                        modifiers={{
                          paymentCommitment: paymentCommitmentDates,
                        }}
                        modifiersClassNames={{
                          paymentCommitment: 'bg-yellow-200 text-yellow-900 rounded-full',
                        }}
                        initialFocus
                      />
                       <div className="p-2 border-t text-center text-xs text-muted-foreground">
                          Días no laborales y con pagos están desactivados.
                       </div>
                    </PopoverContent>
                  </Popover>

                  {isProductProvider && (
                    <AlertDialog open={isCheckoutAlertOpen} onOpenChange={setIsCheckoutAlertOpen}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="relative" disabled={!isCurrentUserTransactionReady || !isProviderTransactionReady}>
                            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                            {totalCartItems > 0 && (
                              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">{totalCartItems}</Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Carrito de Compras</h4>
                              <p className="text-sm text-muted-foreground">
                                Resumen de tu pedido a {provider.name}.
                              </p>
                            </div>
                            {cart.length > 0 ? (
                              <>
                                <div className="grid gap-2 max-h-64 overflow-y-auto">
                                  {cart.map(item => (
                                    <div key={item.product.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                                      <div className="cursor-pointer hover:underline">
                                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                                      </div>
                                      <div className="flex items-center gap-1 border rounded-md">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => updateCartQuantity(item.product.id, 0)}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-sm">
                                  <span>Total:</span>
                                  <span>${getCartTotal().toFixed(2)}</span>
                                </div>
                                <AlertDialogTrigger asChild>
                                  <Button className="w-full">Ver Pre-factura</Button>
                                </AlertDialogTrigger>
                              </>
                            ) : (
                              <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                            <AlertDialogDescription>
                              Revisa tu pedido. Puedes incluir el costo de envío y pagar con Credicora si está disponible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 space-y-4">
                             <div className="flex justify-between text-sm">
                                <span>Dirección de Entrega:</span>
                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => router.push('/map')}>Cambiar</Button>
                            </div>
                            <p className="text-sm font-semibold p-2 bg-muted rounded-md truncate">{deliveryAddress || "No especificada"}</p>
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span className="font-semibold">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="delivery-switch-profile" className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Incluir Delivery
                                </Label>
                                <Switch
                                    id="delivery-switch-profile"
                                    checked={includeDelivery || isDeliveryOnly}
                                    onCheckedChange={setIncludeDelivery}
                                    disabled={isDeliveryOnly}
                                />
                            </div>
                            {isDeliveryOnly && <p className="text-xs text-muted-foreground -mt-2">Este proveedor solo trabaja con delivery.</p>}
                            <div className="flex justify-between text-sm">
                                <span>Costo de envío (aprox):</span>
                                <span className="font-semibold">${(includeDelivery || isDeliveryOnly) ? deliveryCost.toFixed(2) : '0.00'}</span>
                            </div>

                            {providerAcceptsCredicora && (
                                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                                    <Label htmlFor="credicora-switch-profile" className="flex items-center gap-2 text-blue-600 font-semibold">
                                        <Star className="w-4 h-4 fill-current"/>
                                        Pagar con Credicora
                                    </Label>
                                    <Switch
                                        id="credicora-switch-profile"
                                        checked={useCredicora}
                                        onCheckedChange={setUseCredicora}
                                    />
                                </div>
                            )}
                            
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total a Pagar Hoy:</span>
                                <span>${useCredicora ? totalToPayToday.toFixed(2) : totalWithDelivery.toFixed(2)}</span>
                            </div>
                            {useCredicora && financedAmount > 0 && (
                                <p className="text-xs text-muted-foreground -mt-2 text-right">
                                    y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                                </p>
                            )}
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCheckout}>Pagar Ahora</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                   <div className="flex flex-col items-center cursor-pointer" onClick={handleMapPinClick}>
                      <MapPin className={cn("w-5 h-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
                      <span className="text-xs text-muted-foreground">{profileData.distance}</span>
                   </div>
              </div>
            </div>
            
            <div className="flex justify-around text-center text-xs text-muted-foreground pt-4 pb-4">
              {!isProductProvider && (
                <div>
                  <p className="font-semibold text-foreground">{profileData.publications}</p>
                  <p>Publicaciones</p>
                </div>
              )}
              {isProductProvider ? (
                 <div>
                    <p className="font-semibold text-foreground">{providerProducts.length}</p>
                    <p>Productos</p>
                </div>
               ) : (
                 <div>
                    <p className="font-semibold text-foreground">{profileData.completedJobs}</p>
                    <p>Trab. Realizados</p>
                </div>
               )}
            </div>
          </div>
          
          <main className="px-2">
            <Card className="rounded-2xl overflow-hidden shadow-lg relative">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground bg-white/50 rounded-full" onClick={handleDirectMessage}>
                    <Send className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground bg-white/50 rounded-full" onClick={handleSaveContact}>
                    <Bookmark className={cn("w-5 h-5", isSaved && "fill-primary text-primary")} />
                </Button>
              </div>
              <CardContent className="p-0">
               {isProductProvider ? (
                  <div>
                      <div className="p-4 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input 
                            placeholder="Buscar en este catálogo..." 
                            className="pl-10"
                            value={catalogSearchQuery}
                            onChange={(e) => setCatalogSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      {filteredProducts.length > 0 ? (
                        <div className='p-2 grid grid-cols-2 gap-2'>
                          {filteredProducts.map(product => (
                            <ProductGridCard 
                              key={product.id} 
                              product={product}
                              onDoubleClick={() => openProductDetailsDialog(product)}
                             />
                          ))}
                        </div>
                      ) : (
                        <p className='text-center text-muted-foreground py-8'>No se encontraron productos.</p>
                      )}
                  </div>
                ) : (
                  <>
                    {currentImage ? (
                      <div 
                        className="relative group"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onDoubleClick={handleImageDoubleClick}
                      >
                        <Image
                          src={profileData.mainImage}
                          alt="Imagen principal del perfil"
                          width={600}
                          height={400}
                          className="rounded-t-2xl object-cover w-full aspect-[4/3] cursor-pointer"
                          data-ai-hint="professional workspace"
                          key={profileData.mainImage}
                        />
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 left-2 z-10 text-white bg-black/20 rounded-full h-8 w-8"
                            onClick={() => setIsReportDialogOpen(true)}
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        <Button 
                            onClick={handlePrev}
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/20 text-white rounded-full h-8 w-8 z-10"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                            onClick={handleNext}
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/20 text-white rounded-full h-8 w-8 z-10"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                            <div className="flex flex-col items-center">
                                <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleStarClick}>
                                    <Star className={cn("w-5 h-5", isLiked && "fill-yellow-400 text-yellow-400")} />
                                </Button>
                                <span className="text-xs font-bold mt-1">{(starCount / 1000).toFixed(1)}k</span>
                            </div>
                             <div className="flex flex-col items-center">
                                <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={() => openDetailsDialog(currentImageIndex)}>
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                                <span className="text-xs font-bold mt-1">{(messageCount / 1000).toFixed(1)}k</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={handleShareClick}>
                                    <Send className="w-5 h-5" />
                                </Button>
                                <span className="text-xs font-bold mt-1">{shareCount}</span>
                            </div>
                        </div>

                      </div>
                    ) : (
                        <div className='p-8 text-center bg-muted'>
                            <p className='text-muted-foreground'>Este proveedor no tiene publicaciones.</p>
                        </div>
                    )}
                    
                    <div className="flex justify-around font-semibold text-center border-b">
                      <div
                        className={cn(
                          "flex-1 p-3 cursor-pointer",
                          activeTab === 'comentarios' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                        )}
                        onClick={() => setActiveTab('comentarios')}
                      >
                        Comentarios
                      </div>
                      <div
                        className={cn(
                          "flex-1 p-3 cursor-pointer",
                          activeTab === 'mensaje' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                        )}
                        onClick={() => setActiveTab('mensaje')}
                      >
                        Mensaje
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-3 gap-1">
                        {profileData.gallery.map((thumb, index) => (
                            <div 
                                key={index} 
                                className="relative aspect-square cursor-pointer group"
                                onClick={() => setCurrentImageIndex(index)}
                                onDoubleClick={() => openDetailsDialog(index)}
                            >
                            <Image
                                src={thumb.src}
                                alt={thumb.alt}
                                fill
                                 className={cn(
                                    "object-cover transition-all duration-200",
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
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <AlertDialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Solicitar Cita</AlertDialogTitle>
                <AlertDialogDescription>
                    Estás solicitando una cita con <strong>{provider.name}</strong> para el día <strong>{appointmentDate && format(appointmentDate, "dd 'de' MMMM", { locale: es })}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="appointment-details">Motivo o resumen (opcional)</Label>
                    <Textarea
                        id="appointment-details"
                        placeholder="Ej: Revisión general de plomería, tengo una pequeña fuga en el baño."
                        value={appointmentDetails}
                        onChange={(e) => setAppointmentDetails(e.target.value)}
                    />
                </div>
                {provider.profileSetupData?.appointmentCost && provider.profileSetupData.appointmentCost > 0 ? (
                    <div className="p-3 bg-muted rounded-md text-sm">
                        El costo de esta consulta es de <span className="font-bold">${provider.profileSetupData.appointmentCost.toFixed(2)}</span>. Se creará un compromiso de pago al ser aceptada.
                    </div>
                ) : (
                     <div className="p-3 bg-muted rounded-md text-sm">
                        Esta consulta no tiene un costo fijo inicial. El proveedor te enviará una cotización si es necesario.
                    </div>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAppointmentDetails('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAppointment}>Enviar Solicitud</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReportDialog 
            isOpen={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen} 
            providerId={provider.id} 
            publicationId={currentImage?.id || 'provider-img'} 
        />
       {gallery.length > 0 && (
        <ImageDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          gallery={gallery}
          startIndex={detailsDialogStartIndex}
          owner={provider}
        />
      )}
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
