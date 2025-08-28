
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthInstance } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { createSessionCookie } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { firebaseUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    // NO establecer estado aquí para evitar el bloqueo del popup.
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();

    // La llamada a signInWithPopup debe ser lo más directa posible tras el clic.
    signInWithPopup(auth, provider)
      .then(async (result) => {
        // Ahora que el popup se cerró y tenemos respuesta, podemos poner el estado de carga.
        setIsProcessingLogin(true);
        const user = result.user;
        if (user) {
          const idToken = await user.getIdToken();
          const response = await createSessionCookie(idToken);
          
          if (response.success) {
            toast({ title: "¡Autenticación exitosa!", description: `Bienvenido de nuevo a Corabo.` });
            // El AuthProvider y AppLayout se encargarán de la redirección.
          } else {
            throw new Error(response.error || 'Failed to create session.');
          }
        } else {
          throw new Error('No user returned from sign-in');
        }
      })
      .catch((error) => {
        // Este catch maneja errores de red, si el usuario cierra el popup, etc.
        // El error auth/popup-blocked se previene con esta estructura.
        console.error("Popup sign-in error:", error);
        toast({
          variant: "destructive",
          title: `Error de Autenticación (${error.code})`,
          description: "El inicio de sesión fue cancelado o ha fallado. Por favor, inténtalo de nuevo.",
        });
      })
      .finally(() => {
        // Asegurarse de que el estado de carga siempre se desactive.
        setIsProcessingLogin(false);
      });
  };

  // El resto del componente permanece igual...
  if (isLoadingAuth || isProcessingLogin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (firebaseUser) {
    return null;
  }

  return (
    <div className="relative w-full h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
         <Image
            src="https://i.postimg.cc/C1sxJnNT/bv.png"
            alt="Fondo de bienvenida"
            fill
            sizes="50vw"
            quality={90}
            priority
            className="object-cover"
            data-ai-hint="background office"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-10 left-10 text-white p-4 rounded-lg bg-black/30 backdrop-blur-sm">
            <h2 className="text-3xl font-bold">Conecta. Colabora. Crece.</h2>
            <p className="mt-2 max-w-md">La plataforma donde profesionales y clientes se encuentran para realizar proyectos de forma segura y eficiente.</p>
          </div>
      </div>
      <div className="relative flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm text-center">
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
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido a corabO.app</h1>
            <p className="text-muted-foreground mt-2">
                Ingresa para descubrir oportunidades.
            </p>
            <div className="space-y-4 mt-8">
                <Button size="lg" className="w-full" onClick={handleGoogleLogin} disabled={isProcessingLogin}>
                    {isProcessingLogin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar o Registrarse con Google'}
                </Button>
            </div>
             <p className="px-8 text-center text-xs text-muted-foreground mt-10">
                Al continuar, aceptas nuestros{' '}
                <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                   Términos de Servicio
                </a>{' '}
                y{' '}
                <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidad
                </a>
                .
            </p>
        </div>
      </div>
    </div>
  );
}
