'use client';

import React from 'react';
import Image from 'next/image';

// This component is temporarily disabled for diagnostics.
export function MapPageContent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-muted">
       <div className="relative w-full h-full">
           <Image
              src="https://i.postimg.cc/k4SE5k1x/map-placeholder.png"
              alt="Mapa de la ciudad"
              fill
              className="object-cover"
              data-ai-hint="city map"
            />
        </div>
    </div>
  );
}
