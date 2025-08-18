
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, X, CheckCircle, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export function MapPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { setDeliveryAddress, currentUserLocation } = useCorabo();
  
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(currentUserLocation ? { lat: currentUserLocation.latitude, lng: currentUserLocation.longitude } : null);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setSelectedPosition(event.latLng.toJSON());
    }
  };

  const handleConfirmLocation = () => {
    if (!selectedPosition) {
      toast({
        variant: 'destructive',
        title: "Ubicación no seleccionada",
        description: "Por favor, haz clic en el mapa para seleccionar una ubicación.",
      });
      return;
    }
    // We now store coordinates and a simple label
    const addressString = `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`;
    setDeliveryAddress(addressString);
    toast({ title: "Ubicación Confirmada", description: "La nueva ubicación ha sido guardada."});
    router.back();
  };

  // Default to a central point in Caracas if no user location
  const mapCenter = useMemo(() => selectedPosition || { lat: 10.4806, lng: -66.9036 }, [selectedPosition]);

  return (
    <div className="relative h-screen w-screen bg-muted">
      <div className="absolute inset-0">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <Map
                defaultCenter={mapCenter}
                center={mapCenter}
                defaultZoom={15}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                onClick={handleMapClick}
                mapId="corabo_map"
            >
                {selectedPosition && (
                    <AdvancedMarker position={selectedPosition}>
                        <Pin />
                    </AdvancedMarker>
                )}
            </Map>
        </APIProvider>
      </div>

       <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md z-10">
            <X className="h-5 w-5"/>
        </Button>
      
        <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-10">
            <Card className="shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> Define tu Ubicación</h3>
                        <p className="text-sm text-muted-foreground mt-1">Haz clic en el mapa para colocar el marcador en la ubicación deseada.</p>
                    </div>
                     {selectedPosition && (
                         <div className="p-2 bg-muted text-center rounded-md text-xs font-mono">
                           {selectedPosition.lat.toFixed(4)}, {selectedPosition.lng.toFixed(4)}
                         </div>
                     )}
                    <Button className="w-full" onClick={handleConfirmLocation} disabled={!selectedPosition}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Confirmar Ubicación
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
