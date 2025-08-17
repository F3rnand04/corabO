'use client';

import { useState, useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import Link from 'next/link';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

export function MapPageContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const { users, currentUserLocation } = useCorabo();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const center = useMemo(() => {
    if (currentUserLocation) {
        return { lat: currentUserLocation.latitude, lng: currentUserLocation.longitude };
    }
    return { lat: 10.4806, lng: -66.9036 }; // Fallback to Caracas
  }, [currentUserLocation]);

  const providersWithLocation = useMemo(() => {
    return users.filter(
      (user) =>
        user.type === 'provider' &&
        user.profileSetupData?.location &&
        user.profileSetupData?.showExactLocation
    ).map(p => {
        const [lat, lng] = p.profileSetupData!.location!.split(',').map(Number);
        return {...p, position: {lat, lng}};
    });
  }, [users]);
  

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={mapOptions}
      >
        {providersWithLocation.map(provider => (
            <MarkerF 
                key={provider.id} 
                position={provider.position}
                onClick={() => setSelectedProvider(provider)}
            />
        ))}
      </GoogleMap>

       <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md">
            <X className="h-5 w-5"/>
        </Button>
      
      {selectedProvider && (
          <Card className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
            <CardContent className="p-4">
                <Link href={`/companies/${selectedProvider.id}`} className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={selectedProvider.profileImage} />
                        <AvatarFallback>{selectedProvider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold">{selectedProvider.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedProvider.profileSetupData?.specialty}</p>
                        <Badge variant="secondary" className="mt-2">{selectedProvider.profileSetupData?.primaryCategory}</Badge>
                    </div>
                </Link>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
