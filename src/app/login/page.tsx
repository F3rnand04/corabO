
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthInstance } from '@/lib/firebase';
import { signInWithCustomToken, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { signInAsGuest } from '@/lib/actions/auth.actions';

export default function LoginPage() {
  const { isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleAnonymousLogin = async () => {
    const auth = getAuthInstance();
    try {
      // Use the new secure server-side flow
      const result = await signInAsGuest();
      if (result.customToken) {
        await signInWithCustomToken(auth, result.customToken);
        // The onAuthStateChanged listener in AuthProvider will handle the redirect.
        toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión como invitado.' });
      } else {
        throw new Error(result.error || 'No se pudo obtener el token de invitado.');
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error de Inicio de Sesión', description: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    try {
      // Use signInWithRedirect instead of signInWithPopup to avoid popup blockers
      await signInWithRedirect(auth, provider);
      // After redirect, onIdTokenChanged in AuthProvider will detect the session.
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error de Inicio de Sesión', description: error.message });
    }
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
      <Card className="relative z-10 text-center p-8 bg-background rounded-2xl shadow-xl max-w-sm w-full border">
         <CardHeader>
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
            <CardTitle className="text-2xl">Bienvenido a Corabo</CardTitle>
            <CardDescription>
                La plataforma donde profesionales y clientes se encuentran para realizar proyectos de forma segura y eficiente. Ingresa para descubrir oportunidades.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <Button size="lg" className="w-full" onClick={handleGoogleLogin} disabled={isLoadingAuth}>
              {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar o Registrarse con Google'}
            </Button>
            <Button size="lg" className="w-full" variant="secondary" onClick={handleAnonymousLogin} disabled={isLoadingAuth}>
              {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingreso de Prueba'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
