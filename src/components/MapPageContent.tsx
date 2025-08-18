
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, X, CheckCircle, MapPin, LocateFixed } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';

// Internal component to get map instance
function MapHandler({ onCenterChanged, onIdle }: { onCenterChanged: (center: google.maps.LatLngLiteral) => void; onIdle: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const idleListener = map.addListener('idle', () => {
        onIdle();
        const center = map.getCenter();
        if (center) {
            onCenterChanged(center.toJSON());
        }
    });
    return () => idleListener.remove();
  }, [map, onCenterChanged, onIdle]);

  return null;
}


export function MapPageContent() {
  const router = useRouter();
  const { setDeliveryAddress, currentUserLocation } = useCorabo();
  
  const initialPosition = currentUserLocation ? { lat: currentUserLocation.latitude, lng: currentUserLocation.longitude } : { lat: 10.4806, lng: -66.9036 };
  
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(initialPosition);
  const [isMapIdle, setIsMapIdle] = useState(true);

  const handleConfirmLocation = () => {
    const addressString = `${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)}`;
    setDeliveryAddress(addressString);
    router.back();
  };

  return (
    <div className="relative h-screen w-screen bg-muted">
      <div className="absolute inset-0">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} libraries={['marker']}>
            <Map
                defaultCenter={initialPosition}
                defaultZoom={15}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="corabo_map"
                onDrag={() => setIsMapIdle(false)}
            >
               <MapHandler onCenterChanged={setMapCenter} onIdle={() => setIsMapIdle(true)} />
            </Map>
        </APIProvider>
      </div>

       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <LocateFixed className={cn("h-8 w-8 text-primary transition-transform duration-200", !isMapIdle && "scale-125 text-red-500")} />
       </div>

       <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md z-10">
            <X className="h-5 w-5"/>
        </Button>
      
        <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-10">
            <Card className="shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> Define tu Ubicación</h3>
                        <p className="text-sm text-muted-foreground mt-1">Arrastra el mapa para que el marcador central apunte a la ubicación deseada.</p>
                    </div>
                     <div className="p-2 bg-muted text-center rounded-md text-xs font-mono">
                           {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                     </div>
                    <Button className="w-full" onClick={handleConfirmLocation}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Confirmar esta Ubicación
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
