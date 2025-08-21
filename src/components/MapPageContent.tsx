'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, X, Check, LocateFixed } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';
import { env } from '@/env.mjs';

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
  const [isMapIdle, setIsMapIdle] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // This effect runs when the component mounts and the currentUserLocation is available
    // It ensures the map is centered correctly from the start.
    if(currentUserLocation) {
        setMapCenter({ lat: currentUserLocation.latitude, lng: currentUserLocation.longitude });
        setIsMapReady(true);
    }
  }, [currentUserLocation]);


  const handleConfirmLocation = () => {
    const addressString = `${mapCenter.lat},${mapCenter.lng}`;
    setDeliveryAddress(addressString);
    router.back();
  };
  
  const handleClose = () => {
      router.back();
  }

  if (!isMapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Obteniendo ubicación...</p>
      </div>
    );
  }


  return (
    <div className="relative h-screen w-screen bg-muted">
      <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} libraries={['marker']}>
          <Map
              key={`${initialPosition.lat}-${initialPosition.lng}`} // Force re-render when initialPosition changes
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

       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <LocateFixed className={cn("h-8 w-8 text-primary transition-transform duration-200", !isMapIdle && "scale-125 text-red-500")} />
       </div>

       <Button variant="ghost" size="icon" onClick={handleClose} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md z-10">
            <X className="h-5 w-5"/>
        </Button>
      
        <div className="absolute bottom-6 right-6 z-10">
           <Button size="icon" className="w-14 h-14 rounded-full shadow-2xl" onClick={handleConfirmLocation}>
                <Check className="h-7 w-7"/>
           </Button>
        </div>
    </div>
  );
}
