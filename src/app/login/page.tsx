
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, isLoadingAuth } = useAuth();
  const { currentUser, isLoadingUser } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // La redirección post-login es manejada centralmente por AppLayout.tsx
    } catch (error: any) {
       // Ignorar errores comunes de cierre de popup por el usuario
       if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Error signing in with Google:", error);
        toast({
          variant: "destructive",
          title: "Error de Inicio de Sesión",
          description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        });
      }
    }
  };
  
  // Muestra un loader general si se está procesando la autenticación
  // o si el usuario ya está logueado y estamos esperando la redirección.
  // Esto previene que el usuario vea la página de login por un instante si ya tiene sesión.
  if (isLoadingUser || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Si después de cargar todo, ya hay un usuario, AppLayout se encargará de la redirección,
  // pero mientras tanto, mostramos el loader para evitar un flash del contenido de login.
  if (currentUser) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button onClick={handleSignIn} size="lg" className="w-full">
              Ingresa o Regístrate con Google
            </Button>
        </div>
      </div>
    </div>
  );
}
