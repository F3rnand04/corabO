
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthInstance } from '@/lib/firebase';
import { signInWithCustomToken, GoogleAuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth';
import { signInAsGuest } from '@/lib/actions/auth.actions';

export default function LoginPage() {
  const { firebaseUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  const handleAnonymousLogin = async () => {
    const auth = getAuthInstance();
    setIsProcessingLogin(true);
    try {
      const result = await signInAsGuest();
      if (result.customToken) {
        await signInWithCustomToken(auth, result.customToken);
        toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión como invitado.' });
      } else {
        throw new Error(result.error || 'No se pudo obtener el token de invitado.');
      }
    } catch (error: any) {
      console.error("Guest login error:", error);
      toast({ variant: 'destructive', title: 'Error de Inicio de Sesión', description: 'No se pudo completar el ingreso de invitado. Por favor, contacta a soporte.' });
    } finally {
        setIsProcessingLogin(false);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    setIsProcessingLogin(true);
    try {
        const result: UserCredential = await signInWithPopup(auth, provider);
        // The onIdTokenChanged listener in AuthProvider will handle the session cookie.
        toast({ title: "¡Autenticación exitosa!", description: `Bienvenido a Corabo, ${result.user.displayName}.` });
        // AppLayout will handle redirection automatically upon successful auth state change.
    } catch (error: any) {
        // Handle Errors here.
        console.error("Popup sign-in error:", error);
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === 'auth/popup-closed-by-user') {
             toast({
                variant: "default",
                title: "Inicio de sesión cancelado",
                description: "La ventana de inicio de sesión fue cerrada.",
            });
        } else {
             toast({
                variant: "destructive",
                title: `Error de Autenticación (${errorCode})`,
                description: errorMessage,
            });
        }
    } finally {
        setIsProcessingLogin(false);
    }
  };

  // While checking for auth state or processing a login, show a loader.
  if (isLoadingAuth || isProcessingLogin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is already logged in, AppLayout will redirect them.
  // We render null here to avoid flashing the login page.
  if (firebaseUser) {
    return null;
  }

  return (
    <div className="relative w-full h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Columna Izquierda - Imagen */}
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

      {/* Columna Derecha - Formulario de Login */}
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
                <Button size="lg" className="w-full" variant="secondary" onClick={handleAnonymousLogin} disabled={isProcessingLogin}>
                    {isProcessingLogin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingreso de Prueba'}
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
