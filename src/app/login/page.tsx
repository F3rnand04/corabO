
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Box, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle } = useCorabo();

  // AppLayout now handles all redirection logic. This component is now very simple.
  
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Image 
        src="https://i.postimg.cc/C1sxJnNT/bv.png"
        alt="Fondo de bienvenida"
        layout="fill"
        objectFit="cover"
        quality={80}
        priority
        className="z-0"
        data-ai-hint="background office"
      />
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 text-center p-8 bg-background rounded-2xl shadow-xl max-w-sm w-full border">
        <div className="relative w-48 h-24 mx-auto mb-6">
            <Image 
                src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                alt="Corabo logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{objectFit: 'contain'}}
            />
        </div>
        <h2 className="text-2xl font-bold mb-2">Bienvenido a Corabo</h2>
        <div className="mb-4 text-sm text-muted-foreground">
            <p className="font-semibold">Tu marketplace de confianza para todo lo que necesites.</p>
            <p className="mt-2">Encuentra y contrata a los mejores profesionales verificados cerca de ti. Gestiona tus proyectos y pagos de forma segura, todo en un mismo lugar.</p>
        </div>
        <p className="text-muted-foreground mb-8">Conectando tus necesidades con las mejores soluciones.</p>
        <div className="space-y-4">
            <Button onClick={signInWithGoogle} size="lg" className="w-full">
              Ingresa o Regístrate con Google
            </Button>
            <Button variant="link" asChild>
                <Link href="/cashier-login">
                    Acceder a Caja
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
