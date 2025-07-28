
'use client';

import { useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';

export default function MapPage() {
  const { toggleGps, isGpsActive } = useCorabo();
  const router = useRouter();

  useEffect(() => {
    // Activa el GPS solo si no está ya activo al entrar en la página
    if (!isGpsActive) {
      toggleGps();
    }
  }, [isGpsActive, toggleGps]);

  return (
    <div className="relative h-screen w-screen">
      <header className="absolute top-0 left-0 z-10 p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/80 rounded-full shadow-md hover:bg-background">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </header>
      <main className="h-full w-full">
        <Image
          src="https://placehold.co/1080x1920.png"
          alt="Mapa de la ciudad"
          layout="fill"
          objectFit="cover"
          className="pointer-events-none"
          data-ai-hint="city map"
        />
        {/* Aquí iría el componente de mapa interactivo real */}
      </main>
    </div>
  );
}
