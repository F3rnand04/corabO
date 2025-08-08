
'use client';

import { useEffect, useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { APIProvider, Map, AdvancedMarker, MapMouseEvent } from '@vis.gl/react-google-maps';

type MarkerPosition = { lat: number; lng: number } | null;

export default function MapPage() {
  const { currentUser, setDeliveryAddress } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  const [markerPosition, setMarkerPosition] = useState<MarkerPosition>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Client-side effect to read from env
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key) {
      setApiKey(key);
    } else {
      console.error("Google Maps API Key is not set in environment variables.");
       toast({
        variant: "destructive",
        title: "Error de Configuración",
        description: "Falta la clave de API de Google Maps para mostrar el mapa.",
      });
    }
  }, [toast]);
  

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      setMarkerPosition(e.detail.latLng);
    }
  };

  const handleShare = async () => {
    if (!markerPosition) return;
    
    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`;
    
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
      navigator.clipboard.writeText(locationUrl);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a la ubicación ha sido copiado a tu portapapeles.",
      });
    }
  };
  
  const handleSetTemporaryLocation = async () => {
    if (!markerPosition) return;
    // Simulate reverse geocoding
    const tempAddress = `Ubicación personalizada (Lat: ${markerPosition.lat.toFixed(4)}, Lng: ${markerPosition.lng.toFixed(4)})`;
    setDeliveryAddress(tempAddress);
    toast({
        title: 'Ubicación Temporal Establecida',
        description: 'La dirección de entrega ha sido actualizada.',
    });
    router.back();
  }

  if(!currentUser || !apiKey) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
     <APIProvider apiKey={apiKey}>
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
                            Usar como ubicación
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
        <main className="h-full w-full">
            <Map
                defaultCenter={{ lat: 10.4806, lng: -66.9036 }} // Caracas
                defaultZoom={12}
                mapId="corabo_map"
                onClick={handleMapClick}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {markerPosition && (
                    <AdvancedMarker position={markerPosition}>
                         <MapPin className="h-10 w-10 text-red-500 fill-red-500 drop-shadow-lg" />
                    </AdvancedMarker>
                )}
            </Map>
        </main>
        </div>
    </APIProvider>
  );
}
