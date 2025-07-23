
'use client';

import React, { useState, TouchEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Share2, Plus, Calendar, Wallet, MapPin, ChevronLeft, ChevronRight, MessageCircle, Send } from 'lucide-react';
import ProfileFooter from '@/components/ProfileFooter';
import { cn } from '@/lib/utils';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';

type GalleryImage = {
  src: string;
  alt: string;
  description: string;
};

export default function ProfilePage() {
  const providerProfile = {
    name: "NOMBRE USUARIO",
    specialty: "Especialidad",
    rating: 4.9,
    efficiency: "99.9%",
    publications: 30,
    completedJobs: 15,
    otherStat: "00 | 05",
    profileImage: "https://placehold.co/128x128.png",
    gallery: [
      { src: "https://placehold.co/600x400.png?text=1", alt: "Imagen 1", description: "Descripción detallada de la primera imagen promocional." },
      { src: "https://placehold.co/600x400.png?text=2", alt: "Imagen 2", description: "Descripción detallada de la segunda imagen." },
      { src: "https://placehold.co/600x400.png?text=3", alt: "Imagen 3", description: "Esta es la tercera imagen, mostrando otro ángulo del producto." },
      { src: "https://placehold.co/600x400.png?text=4", alt: "Imagen 4", description: "Cuarta imagen de la galería de promociones." },
      { src: "https://placehold.co/600x400.png?text=5", alt: "Imagen 5", description: "Quinta imagen, enfocada en los detalles." },
      { src: "https://placehold.co/600x400.png?text=6", alt: "Imagen 6", description: "Sexta y última imagen de esta promoción." },
    ],
    shareCount: 4567,
    starCount: 8934.5,
    messageCount: 8900,
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      prevIndex === 0 ? providerProfile.gallery.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === providerProfile.gallery.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleImageDoubleClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsDialogOpen(true);
  };

  const currentImage = providerProfile.gallery[currentImageIndex];

  return (
    <>
      <div className="bg-background min-h-screen">
        <main className="container mx-auto py-4 px-2 space-y-4 max-w-2xl pb-24">
          
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="relative shrink-0">
              <Avatar>
                <AvatarImage src={providerProfile.profileImage} alt={providerProfile.name} data-ai-hint="user profile photo"/>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gray-200 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center border-2 border-background cursor-pointer">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-grow">
              <h1 className="text-lg font-bold text-foreground">{providerProfile.name}</h1>
              <p className="text-sm text-muted-foreground">{providerProfile.specialty}</p>
              <div className="flex items-center gap-3 text-sm mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                      <span className="font-semibold text-foreground">{providerProfile.rating.toFixed(1)}</span>
                  </div>
                  <Separator />
                  <span>{providerProfile.efficiency} Efec.</span>
                  <Separator />
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
                  <p className="font-semibold text-foreground">{providerProfile.publications}</p>
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
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
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
                <div className="flex-1 p-3 cursor-pointer border-b-2 border-primary text-primary">
                  Promoción del Día
                </div>
                <div className="flex-1 p-3 cursor-pointer text-muted-foreground">
                  Editar Descripción
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="p-4 grid grid-cols-3 gap-2">
                  {providerProfile.gallery.map((thumb, index) => (
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
                      </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </main>
        <ProfileFooter />
      </div>
      {selectedImage && (
        <ImageDetailsDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          image={selectedImage}
        />
      )}
    </>
  );
}


// Helper components to match the design structure
function Avatar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted bg-gray-100 flex items-center justify-center">
      {children}
    </div>
  );
}

function AvatarImage({ src, alt, ...props }: { src: string, alt: string, "data-ai-hint": string }) {
  return <Image src={src} alt={alt} width={64} height={64} className="object-cover w-full h-full" {...props}/>;
}

function Separator() {
    return <div className="h-4 w-px bg-border"></div>
}
