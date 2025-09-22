'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <Image 
          src="https://i.postimg.cc/YSNBv5DT/logo-light-png.png"
          alt="Corabo logo"
          width={192}
          height={64}
          priority
          className="object-contain mb-6"
      />
      <h2 className="text-2xl font-bold text-destructive">Error 404</h2>
      <p className="mt-2 text-lg text-muted-foreground">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Es posible que el enlace esté roto o que la página haya sido eliminada.
      </p>
      <Button className="mt-8" onClick={() => router.push('/')}>
        Volver a la Página Principal
      </Button>
    </div>
  )
}
