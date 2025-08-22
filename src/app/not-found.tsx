
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="relative w-48 h-24 mx-auto mb-8">
             <Image 
                src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                alt="Corabo logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
            />
        </div>
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        Página No Encontrada
      </h2>
      <p className="mt-2 text-muted-foreground">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Button onClick={() => router.push('/')} className="mt-8">
        <Home className="mr-2 h-4 w-4" />
        Volver al Inicio
      </Button>
    </div>
  );
}
