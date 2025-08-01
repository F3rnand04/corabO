
'use client';

import { useParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Calendar, MapPin, Bookmark, Send, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, ThumbsUp, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState, TouchEvent, useEffect } from 'react';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import type { User, GalleryImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from '@/components/ReportDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogFooter, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';

export default function CompanyProfilePage() {
  const params = useParams();
  const { users, addContact, transactions, createAppointmentRequest, currentUser } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();
  
  const provider = users.find(u => u.id === params.id);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isAppointmentSuccess, setIsAppointmentSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [businessStatus, setBusinessStatus] = useState<'open' | 'closed'>('closed');
  
  const minSwipeDistance = 50;

  // Local state for interactions
  const [starCount, setStarCount] = useState(8934);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(4567);
  const [messageCount, setMessageCount] = useState(1234);
  const [activeTab, setActiveTab] = useState('comentarios');
  const [gpsReady, setGpsReady] = useState(false);
  
  useEffect(() => {
    // This effect helps avoid hydration mismatches for client-specific logic like GPS status
    setGpsReady(true);
  }, []);


  if (!provider) {
    return (
      <main className="container py-8">
        <h1 className="text-3xl font-bold">Perfil no encontrado</h1>
        <p className="text-muted-foreground">No se pudo encontrar el proveedor.</p>
      </main>
    );
  }
  
  const paymentCommitmentDates = transactions
    .filter(tx => tx.providerId === provider.id && tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución')
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
    if (date && provider) {
        createAppointmentRequest({
            providerId: provider.id,
            date: date,
            details: `Solicitud de cita desde perfil para el ${format(date, "dd/MM/yyyy")}`
        });
        setSelectedDate(date);
        setIsAppointmentSuccess(true);
    }
  }


  const gallery: GalleryImage[] = provider.gallery || [];
  
  const displayName = provider.profileSetupData?.useUsername 
        ? provider.profileSetupData.username || provider.name 
        : provider.name;
    const specialty = provider.profileSetupData?.specialty || "Especialidad de la Empresa";
  
  const displayDistance = provider.profileSetupData?.showExactLocation ? "A menos de 1km" : "500m - 1km";
  
  const profileData = {
    name: displayName,
    specialty: specialty,
    rating: provider.reputation || 4.9,
    efficiency: "99.9%",
    otherStat: "00 | 05",
    publications: gallery.length,
    completedJobs: 15,
    distance: displayDistance,
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
    addContact(provider);
  };
  
  const currentImage = gallery.length > 0 ? gallery[currentImageIndex] : null;

  return (
    <>
      <div className="bg-background min-h-screen">
        <main className="container mx-auto py-4 px-2 space-y-4 max-w-2xl pb-24">
          
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
                  <span>{profileData.efficiency}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{profileData.otherStat}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
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
                          ...paymentCommitmentDates
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
                        Días no laborales desactivados.
                     </div>
                  </PopoverContent>
                </Popover>
                 <div className="flex flex-col items-center cursor-pointer" onClick={() => provider.profileSetupData?.hasPhysicalLocation && router.push('/map')}>
                    <MapPin className={cn("w-5 h-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-xs text-muted-foreground">{profileData.distance}</span>
                 </div>
            </div>
          </div>
          
          <div className="flex justify-around text-center text-xs text-muted-foreground -mt-2">
            <div className="flex-1">
                  <p className="font-semibold text-foreground">{profileData.publications}</p>
                  <p>Publicaciones</p>
            </div>
              <div className="flex-1">
                  <p className="font-semibold text-foreground">{profileData.completedJobs}</p>
                  <p>Trab. Realizados</p>
              </div>
          </div>

          {/* Main Content Card */}
          <Card className="rounded-2xl overflow-hidden shadow-lg relative">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 text-muted-foreground bg-white/50 rounded-full" onClick={handleSaveContact}>
                <Bookmark className="w-5 h-5" />
            </Button>
            <CardContent className="p-0">
              {currentImage && (
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
                      className="absolute top-2 left-2 z-10 text-white bg-black/20 rounded-full"
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
                          <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10" onClick={() => openDetailsDialog(currentImage)}>
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

              {/* Gallery Grid */}
              <div className="p-2 grid grid-cols-3 gap-1">
                  {profileData.gallery.map((thumb, index) => (
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
            </CardContent>
          </Card>
        </main>
      </div>
       <AlertDialog open={isAppointmentSuccess} onOpenChange={setIsAppointmentSuccess}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¡Solicitud de Cita Enviada!</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hemos notificado a <strong>{provider.name}</strong> sobre tu interés en agendar una cita para el día <strong>{selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: es })}</strong>. Recibirás una notificación o un mensaje directo para confirmar los detalles.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setIsAppointmentSuccess(false)}>Entendido</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      <ReportDialog 
            isOpen={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen} 
            providerId={provider.id} 
            publicationId={currentImage?.id || 'provider-img'} 
        />
       {selectedImage && (
        <ImageDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          image={selectedImage}
          isOwnerView={false}
          onCommentSubmit={() => setMessageCount(prev => prev + 1)}
        />
      )}
    </>
  );
}
