
'use client';

import { useEffect, useState, MouseEvent } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type MarkerPosition = { x: number; y: number } | null;

export default function MapPage() {
  const { toggleGps, isGpsActive, currentUser, setTemporaryLocation, setDeliveryAddress } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  const [markerPosition, setMarkerPosition] = useState<MarkerPosition>(null);

  useEffect(() => {
    // Activa el GPS solo si no está ya activo al entrar en la página
    if (!isGpsActive) {
      toggleGps(currentUser.id);
    }
  }, [isGpsActive, toggleGps, currentUser.id]);

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMarkerPosition({ x, y });
  };

  const handleShare = async () => {
    if (!markerPosition) return;
    
    // Simular coordenadas a partir de la posición del clic
    const lat = 40.7128 - (markerPosition.y / 1000);
    const lon = -74.0060 + (markerPosition.x / 1000);
    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ubicación Compartida',
          text: 'Aquí está la ubicación que seleccioné.',
          url: locationUrl,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
        toast({
            variant: "destructive",
            title: "Error al compartir",
            description: "No se pudo compartir la ubicación.",
        });
      }
    } else {
      // Fallback para navegadores que no soportan la API de compartir
      navigator.clipboard.writeText(locationUrl);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a la ubicación ha sido copiado a tu portapapeles.",
      });
    }
  };
  
  const handleSetTemporaryLocation = () => {
    if (!markerPosition) return;
    // Simulate a reverse geocoded address
    const tempAddress = `Calle Ficticia ${markerPosition.x}, Sector ${markerPosition.y}`;
    setDeliveryAddress(tempAddress);
    toast({
        title: 'Ubicación Temporal Establecida',
        description: 'La dirección de entrega ha sido actualizada para esta compra.',
    });
    router.back();
  }

  if(!currentUser) return null;


  return (
    <div className="relative h-screen w-screen bg-gray-200">
      <header className="absolute top-0 left-0 z-20 p-4 w-full">
         <div className="flex justify-between items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/80 rounded-full shadow-md hover:bg-background">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            {markerPosition && (
                <div className="flex gap-2">
                    <Button onClick={handleSetTemporaryLocation} className="bg-secondary text-secondary-foreground rounded-full shadow-lg">
                        <MapPin className="mr-2 h-4 w-4" />
                        Usar como ubicación temporal
                    </Button>
                    <Button onClick={handleShare} className="bg-primary text-primary-foreground rounded-full shadow-lg">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                    </Button>
                </div>
            )}
         </div>
         {!markerPosition && (
            <div className="mt-4 p-2 bg-background/80 rounded-md text-center text-sm font-semibold">
                Haz clic en el mapa para colocar un pin.
            </div>
         )}
      </header>
      <main className="h-full w-full" onClick={handleMapClick}>
        <div className="relative h-full w-full cursor-pointer">
            <Image
                src="https://i.postimg.cc/t4G23p6x/map-placeholder.png"
                alt="Mapa de la ciudad"
                layout="fill"
                objectFit="cover"
                className="pointer-events-none"
                data-ai-hint="city map"
                priority
            />
            {markerPosition && (
                <div 
                    className="absolute z-10"
                    style={{ left: `${markerPosition.x}px`, top: `${markerPosition.y}px`, transform: 'translate(-50%, -100%)' }}
                >
                    <MapPin className="h-10 w-10 text-red-500 fill-red-500 drop-shadow-lg animate-bounce" />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
