
'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Forward } from 'lucide-react';

export function LocationBubble({ lat, lon, onForward }: { lat: number, lon: number, onForward: () => void }) {
  const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  // NOTE: Using a placeholder for the map image as direct map tiles can violate TOS.
  const staticMapImageUrl = `https://picsum.photos/seed/map/400/200`;

  return (
    <div className="flex flex-col items-center w-full my-2">
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm rounded-lg border bg-background shadow-md p-0.5 space-y-1 overflow-hidden group">
        <div className="relative aspect-video w-full">
           <Image
              src={staticMapImageUrl}
              alt="Mapa de ubicación"
              width={400}
              height={200}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              data-ai-hint="map location"
            />
        </div>
        <div className="p-2 text-center">
            <p className="text-sm font-semibold">Ubicación Compartida</p>
            <p className="text-xs text-blue-600 group-hover:underline">Ver en Google Maps</p>
        </div>
      </a>
      <Button variant="outline" size="sm" className="mt-2" onClick={onForward}>
        <Forward className="w-4 h-4 mr-2" />
        Reenviar Ubicación
      </Button>
    </div>
  );
}
