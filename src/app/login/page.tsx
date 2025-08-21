
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

  useEffect(() => {
    // Si ya no estamos cargando y hay un usuario, redirigir a la página principal.
    // Esto evita que un usuario ya logueado vea la página de login.
    if (!isLoadingUser && currentUser) {
      router.replace('/');
    }
  }, [currentUser, isLoadingUser, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // La redirección post-login es manejada por el AppLayout.
    } catch (error: any) {
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
  
  // Mientras se verifica el estado de autenticación o si ya hay un usuario
  // (y estamos esperando la redirección), muestra un loader.
  if (isLoadingUser || isLoadingAuth || currentUser) {
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
        <p className="text-muted-foreground mb-8">
            Conectando tus necesidades con las mejores soluciones.
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
