
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function MapPage() {
  const { currentUser, setDeliveryAddress } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  
  // Simulate placing a pin on the static map
  const [pinPlaced, setPinPlaced] = useState(false);

  const handleMapClick = () => {
    setPinPlaced(true);
  };

  const handleShare = async () => {
    if (!pinPlaced) return;
    
    // Share a generic Google Maps link for Caracas as a placeholder
    const locationUrl = `https://www.google.com/maps/search/?api=1&query=10.4806,-66.9036`;
    
    try {
        await navigator.share({
          title: 'Ubicación Compartida',
          text: 'Aquí está la ubicación que seleccioné.',
          url: locationUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(locationUrl);
        toast({
          title: "Enlace Copiado",
          description: "El enlace a la ubicación ha sido copiado a tu portapapeles.",
        });
      }
  };
  
  const handleSetTemporaryLocation = async () => {
    if (!pinPlaced) return;
    const tempAddress = `Ubicación personalizada (Ejemplo)`;
    setDeliveryAddress(tempAddress);
    toast({
        title: 'Ubicación de Ejemplo Establecida',
        description: 'La dirección de entrega ha sido actualizada con una ubicación de ejemplo.',
    });
    router.back();
  }

  if(!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-gray-200">
    <header className="absolute top-0 left-0 z-20 p-4 w-full">
        <div className="flex justify-between items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/80 rounded-full shadow-md hover:bg-background">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            {pinPlaced && (
                <div className="flex gap-2">
                    <Button onClick={handleSetTemporaryLocation} className="bg-secondary text-secondary-foreground rounded-full shadow-lg">
                        <MapPin className="mr-2 h-4 w-4" />
                        Usar como ubicación
                    </Button>
                    <Button onClick={handleShare} className="bg-primary text-primary-foreground rounded-full shadow-lg">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                    </Button>
                </div>
            )}
        </div>
        {!pinPlaced && (
            <div className="mt-4 p-2 bg-background/80 rounded-md text-center text-sm font-semibold">
                Haz clic en el mapa para colocar un pin de ejemplo.
            </div>
        )}
    </header>
    <main className="h-full w-full cursor-pointer" onClick={handleMapClick}>
        <Image 
            src="https://i.postimg.cc/B6N1W2d5/map-placeholder.png"
            alt="Mapa de marcador de posición"
            fill
            style={{objectFit: 'cover'}}
            priority
        />
         {pinPlaced && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <MapPin className="h-12 w-12 text-red-500 fill-red-500 drop-shadow-lg animate-bounce" />
            </div>
        )}
    </main>
    </div>
  );
}
