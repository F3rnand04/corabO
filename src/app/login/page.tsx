
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-client';
import { signInAsGuest, createSessionCookie } from '@/lib/actions/auth.actions';
import { useAuth } from '@/hooks/use-auth-provider';
import GoogleIcon from '@/components/GoogleIcon';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { isLoadingAuth } = useAuth(); // Use the central loading state
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  const handleGuestLogin = async () => {
    setIsProcessingLogin(true);
    try {
        const response = await signInAsGuest();
        if (response.customToken) {
            const userCredential = await signInWithCustomToken(auth, response.customToken);
            const firebaseUser = userCredential.user;
            const idToken = await firebaseUser.getIdToken();
            await createSessionCookie(idToken);
            // Let the AuthProvider handle the redirect, don't force it here
            // window.location.href = '/'; 
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
  
  const handleGoogleLogin = async () => {
    setIsProcessingLogin(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();
        
        await createSessionCookie(idToken);
        
        // Let the AuthProvider handle the redirect
        // window.location.href = '/';

    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
          variant: "destructive",
          title: "Error de Autenticación",
          description: error.message || "No se pudo iniciar sesión con Google.",
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
    <div className="relative w-full h-screen flex items-center justify-center p-4">
      {/* Background Image */}
      <Image
        src="https://i.postimg.cc/sXwFcprc/welcome-bg-png.png"
        alt="Fondo de bienvenida"
        fill
        quality={90}
        priority
        className="object-cover -z-20"
        data-ai-hint="background office"
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 -z-10" />

      {/* Centered Login Card */}
      <div className="w-full max-w-sm text-center bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10">
        <div className="relative w-48 h-24 mx-auto mb-6">
            <Image
                src="https://i.postimg.cc/8zWvkhxS/Sin-t-tulo-3.png"
                alt="Corabo logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
            />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Conecta. Colabora. Crece.</h1>
        <p className="text-muted-foreground mt-2">
            La plataforma donde profesionales y clientes se encuentran para realizar proyectos de forma segura y eficiente.
        </p>
        <div className="space-y-4 mt-8">
            <Button size="lg" className="w-full bg-white text-gray-800 hover:bg-gray-200" onClick={handleGoogleLogin}>
               <GoogleIcon className="w-6 h-6 mr-2" />
               Ingresar con Google
            </Button>
            <Button size="lg" className="w-full" onClick={handleGuestLogin}>
                Ingresar como Invitado
            </Button>
        </div>
        <p className="px-8 text-center text-xs text-muted-foreground mt-10">
            Al continuar, aceptas nuestros{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
               Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidad
            </Link>
            .
        </p>
      </div>
    </div>
  );
}
