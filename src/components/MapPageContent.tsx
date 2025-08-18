
'use client';

import { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './ui/card';
import { useToast } from '@/hooks/use-toast';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
};

const libraries: ("geocoding")[] = ["geocoding"];

export function MapPageContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "", // FIX: Use empty string to avoid API key errors in this context.
    libraries,
  });

  const { currentUserLocation, setDeliveryAddress } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const center = useMemo(() => {
    if (currentUserLocation) {
        return { lat: currentUserLocation.latitude, lng: currentUserLocation.longitude };
    }
    return { lat: 10.4806, lng: -66.9036 }; // Fallback to Caracas
  }, [currentUserLocation]);
  
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
          const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setMarkerPosition(newPos);
          // **FIX**: Instead of geocoding, just use the coordinates directly.
          setSelectedAddress(`Lat: ${newPos.lat.toFixed(6)}, Lon: ${newPos.lng.toFixed(6)}`);
      }
  }, []);
  
  const handleConfirmLocation = () => {
    if (selectedAddress && markerPosition) {
        // We store the address and coordinates for future use
        // The address is now the coordinates string.
        const locationString = `${selectedAddress}|${markerPosition.lat},${markerPosition.lng}`;
        setDeliveryAddress(locationString);
        toast({ title: "Ubicación Confirmada", description: "Las coordenadas han sido guardadas."});
        router.back();
    }
  };


  if (loadError) return <div>Error al cargar los mapas. Por favor, contacta a soporte.</div>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={center}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {markerPosition && <MarkerF position={markerPosition} />}
      </GoogleMap>

       <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md z-10">
            <X className="h-5 w-5"/>
        </Button>
      
      {selectedAddress && (
          <Card className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
            <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">Ubicación Seleccionada</h3>
                   <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                </div>
                 <Button className="w-full" onClick={handleConfirmLocation}>
                     <CheckCircle className="mr-2 h-4 w-4"/>
                    Confirmar Ubicación
                </Button>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
