
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { createSessionCookie, signInAsGuest } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { firebaseUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    setIsProcessingLogin(true);
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        if (user) {
          const idToken = await user.getIdToken();
          const response = await createSessionCookie(idToken);
          
          if (response.success) {
            toast({ title: "¡Autenticación exitosa!", description: `Bienvenido de nuevo a Corabo.` });
            // AppLayout will handle the redirect
          } else {
            throw new Error(response.error || 'Failed to create session cookie.');
          }
        } else {
          throw new Error('No user returned from Google Sign-In.');
        }
      })
      .catch((error) => {
        console.error("Google Sign-In Error:", error);
        let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/popup-blocked') {
          description = "El navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio e inténtalo de nuevo.";
        } else if (error.code === 'auth/popup-closed-by-user') {
          description = "La ventana de inicio de sesión fue cerrada. Inténtalo de nuevo.";
        } else if (error.code === 'auth/unauthorized-domain') {
            description = "El dominio no está autorizado para esta operación. Contacta a soporte."
        }
        toast({
          variant: "destructive",
          title: "Error de Autenticación",
          description: description,
        });
      })
      .finally(() => {
        setIsProcessingLogin(false);
      });
  };
  
  const handleGuestLogin = async () => {
    setIsGuestProcessing(true);
    try {
        const response = await signInAsGuest();
        if (response.customToken) {
            await signInWithCustomToken(auth, response.customToken);
            toast({ title: "Acceso de invitado", description: "Bienvenido a Corabo." });
             // AppLayout will handle the redirect
        } else {
            throw new Error(response.error || "No se pudo obtener el token de invitado.");
        }
    } catch (error: any) {
        console.error("Guest Sign-In Error:", error);
        toast({
          variant: "destructive",
          title: "Error de Invitado",
          description: error.message || "No se pudo iniciar sesión como invitado.",
        });
    } finally {
        setIsGuestProcessing(false);
    }
  };


  if (isLoadingAuth || isProcessingLogin || isGuestProcessing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (firebaseUser) {
    // The AppLayout component is now responsible for all redirection logic.
    // We render nothing here while waiting for the redirect.
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
                <Button size="lg" variant="secondary" className="w-full" onClick={handleGuestLogin} disabled={isGuestProcessing}>
                    {isGuestProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar como Invitado'}
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
