'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { signInAsGuest, createSessionCookie } from '@/lib/actions/auth.actions';
import { useAuth } from '@/hooks/use-auth-provider';

export default function LoginPage() {
  const { toast } = useToast();
  const { isLoadingAuth } = useAuth(); // Use the central loading state
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  const handleGuestLogin = async () => {
    setIsProcessingLogin(true);
    try {
        const response = await signInAsGuest();
        if (response.customToken) {
            const userCredential = await signInWithCustomToken(auth, response.customToken);
            const idToken = await userCredential.user.getIdToken();
            await createSessionCookie(idToken);
            // The AuthProvider will detect the user and handle the redirect,
            // but a reload can ensure everything is synchronized.
            window.location.reload(); 
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
        setIsProcessingLogin(false);
    }
  };
  
  // Show a loader if either the main auth provider is loading or a specific login action is processing.
  if (isLoadingAuth || isProcessingLogin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
         <Image
            src="https://i.postimg.cc/sXwFcprc/welcome-bg-png.png"
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
                    src="https://i.postimg.cc/YSNBv5DT/logo-light-png.png"
                    alt="Corabo logo"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido</h1>
            <p className="text-muted-foreground mt-2">
                Ingresa para descubrir un mundo de oportunidades y llevar tus proyectos al siguiente nivel.
            </p>
            <div className="space-y-4 mt-8">
                <Button size="lg" variant="secondary" className="w-full" onClick={handleGuestLogin}>
                    Ingresar como Invitado
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
