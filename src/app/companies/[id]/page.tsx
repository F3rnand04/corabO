
'use client';

import { useParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Calendar, MapPin, Bookmark, Send, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState, TouchEvent } from 'react';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type GalleryImage = NonNullable<User['gallery']>[0];


export default function CompanyProfilePage() {
  const params = useParams();
  const { users } = useCorabo();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('comentarios');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const minSwipeDistance = 50;

  // Find the specific provider by id from the URL
  const provider = users.find(u => u.id === params.id);
  
  // Local state for interactions
  const [starCount, setStarCount] = useState(8934);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(4567);
  const [messageCount, setMessageCount] = useState(1234);


  if (!provider) {
    return (
      <main className="container py-8">
        <h1 className="text-3xl font-bold">Perfil no encontrado</h1>
        <p className="text-muted-foreground">No se pudo encontrar el proveedor.</p>
      </main>
    );
  }
  
  const gallery: GalleryImage[] = provider.gallery || [];
  
  const profileData = {
    name: provider.name,
    specialty: provider.profileSetupData?.specialty || "Especialidad de la Empresa",
    rating: provider.reputation || 4.9,
    efficiency: "99.9%",
    otherStat: "00 | 05",
    publications: gallery.length,
    completedJobs: 15,
    distance: "2.5 km",
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

  const handleImageDoubleClick = (image: GalleryImage) => {
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
                <Button variant="ghost" size="icon"><Calendar className="w-5 h-5 text-muted-foreground" /></Button>
                 <div className="flex flex-col items-center">
                    <MapPin className="w-5 h-5 text-green-500" />
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
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 text-muted-foreground bg-white/50 rounded-full">
                <Bookmark className="w-5 h-5" />
            </Button>
            <CardContent className="p-0">
              {currentImage && (
                <div 
                  className="relative group"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onDoubleClick={() => handleImageDoubleClick(currentImage)}
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
                      onClick={handlePrev}
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1/3 left-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button 
                      onClick={handleNext}
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1/3 right-2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
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
