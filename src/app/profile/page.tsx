'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Share2, Plus, Calendar, Wallet, MapPin } from 'lucide-react';
import ProfileFooter from '@/components/ProfileFooter';
import { cn } from '@/lib/utils';

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
    mainImage: "https://placehold.co/600x400.png",
    shareCount: 4567,
    starCount: 8934.5,
    thumbnails: [
      "https://placehold.co/600x400.png?text=1",
      "https://placehold.co/600x400.png?text=2",
      "https://placehold.co/600x400.png?text=3",
      "https://placehold.co/600x400.png?text=4",
      "https://placehold.co/600x400.png?text=5",
      "https://placehold.co/600x400.png?text=6",
    ],
  };

  const [currentMainImage, setCurrentMainImage] = useState(providerProfile.mainImage);


  return (
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
            <div className="relative">
              <Image
                src={currentMainImage}
                alt="Main content image"
                width={600}
                height={400}
                className="rounded-t-2xl object-cover w-full aspect-[4/3] transition-opacity duration-300"
                data-ai-hint="professional workspace"
                key={currentMainImage} 
              />
              <div className="absolute top-4 right-4 flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center text-foreground">
                    <Share2 className="h-7 w-7 drop-shadow-md"/>
                    <span className="text-xs font-semibold drop-shadow-md">{providerProfile.shareCount}</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 flex flex-col items-center">
                <Star className="text-yellow-400 fill-yellow-400 h-8 w-8 drop-shadow-md"/>
                <span className="text-sm text-foreground font-bold drop-shadow-md">{providerProfile.starCount.toFixed(1)}</span>
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
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                {providerProfile.thumbnails.map((thumb, index) => (
                    <div 
                        key={index} 
                        className="relative aspect-square cursor-pointer group"
                        onClick={() => setCurrentMainImage(thumb)}
                    >
                    <Image
                        src={thumb}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className={cn(
                            "rounded-lg object-cover transition-all duration-200",
                            currentMainImage === thumb 
                                ? "ring-2 ring-primary ring-offset-2" 
                                : "ring-0 group-hover:opacity-80"
                        )}
                        data-ai-hint="product image"
                    />
                    </div>
                ))}
                </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <ProfileFooter />
    </div>
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
