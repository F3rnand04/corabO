
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthInstance } from '@/lib/firebase';
import { signInWithCustomToken, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { signInAsGuest } from '@/lib/actions/auth.actions';

export default function LoginPage() {
  const { isLoadingAuth } = useAuth();
  const { toast } = useToast();

  const handleAnonymousLogin = async () => {
    const auth = getAuthInstance();
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
      toast({ variant: 'destructive', title: 'Error de Inicio de Sesión', description: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    try {
      // Inicia el proceso de redirección a la página de login de Google.
      // El resultado se gestionará en AuthProvider cuando el usuario regrese a la app.
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in redirect error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error de Inicio de Sesión con Google', 
        description: error.message || 'No se pudo iniciar el proceso de autenticación. Por favor, intenta de nuevo.'
      });
    }
  };

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
                <Button size="lg" className="w-full" onClick={handleGoogleLogin} disabled={isLoadingAuth}>
                    {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar o Registrarse con Google'}
                </Button>
                <Button size="lg" className="w-full" variant="secondary" onClick={handleAnonymousLogin} disabled={isLoadingAuth}>
                    {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingreso de Prueba'}
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
