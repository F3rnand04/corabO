'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="relative w-48 h-24 mx-auto mb-6">
            <Image 
                src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                alt="Corabo logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
            />
        </div>
      <h2 className="text-2xl font-bold text-destructive">Error 404</h2>
      <p className="mt-2 text-lg text-muted-foreground">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Es posible que el enlace esté roto o que la página haya sido eliminada.
      </p>
      <Link href="/">
        <Button className="mt-8">
          Volver a la Página Principal
        </Button>
      </Link>
    </div>
  )
}
