
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, isLoadingAuth } = useAuth();
  
  const handleSignIn = async () => {
    // The signInWithGoogle function now handles the full, seamless sign-in flow.
    await signInWithGoogle();
  };
  
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Image 
        src="https://i.postimg.cc/C1sxJnNT/bv.png"
        alt="Fondo de bienvenida"
        fill
        sizes="100vw"
        quality={80}
        priority
        className="z-0 object-cover"
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
                className="object-contain"
            />
        </div>
        <h2 className="text-2xl font-bold mb-2">Bienvenido a Corabo</h2>
        <p className="text-muted-foreground mb-8">
            Tu ecosistema de confianza para conectar con profesionales, comprar productos y gestionar tus servicios de forma segura y transparente.
        </p>
        <div className="space-y-4">
            <Button onClick={handleSignIn} size="lg" className="w-full" disabled={isLoadingAuth}>
              {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresa o Regístrate con Google'}
            </Button>
        </div>
      </div>
    </div>
  );
}
