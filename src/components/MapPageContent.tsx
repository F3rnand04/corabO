'use client';

import React from 'react';
import Image from 'next/image';

export function MapPageContent() {
  
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-muted">
        <div className="relative w-full h-full">
            <Image
                src="https://picsum.photos/seed/map/1200/800"
                alt="Mapa de la ciudad"
                fill
                className="object-cover"
                data-ai-hint="map city"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
                <h2 className="text-2xl font-bold">Mapa Interactivo</h2>
                <p className="mt-2 text-lg">(Funcionalidad en desarrollo)</p>
            </div>
        </div>
    </div>
  );
}
