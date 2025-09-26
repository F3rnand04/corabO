
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  type AuthCredential
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-client';
import { createSessionCookie } from '@/lib/actions/auth.actions';
import { useAuth } from '@/hooks/use-auth-provider';
import GoogleIcon from '@/components/GoogleIcon';
import Link from 'next/link';

// Define the states for the login UI
type UiState = 'google-only' | 'linking-account';

export default function LoginPage() {
  const { toast } = useToast();
  const { isLoadingAuth } = useAuth();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  
  // State for handling account linking
  const [uiState, setUiState] = useState<UiState>('google-only');
  const [pendingCred, setPendingCred] = useState<AuthCredential | null>(null);
  const [emailForSignIn, setEmailForSignIn] = useState('');
  const [password, setPassword] = useState('');

  const handleSuccessfulLogin = async (user: any) => {
    const idToken = await user.getIdToken();
    await createSessionCookie(idToken);
    // The AuthProvider will handle the redirect automatically
  };

  const handleGoogleLogin = async () => {
    setIsProcessingLogin(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccessfulLogin(result.user);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData.email;
        setPendingCred(GoogleAuthProvider.credentialFromError(error)!);
        setEmailForSignIn(email);
        setUiState('linking-account');
        toast({
            variant: 'default',
            title: "Vincular Cuenta de Google",
            description: `Ya existe una cuenta con ${email}. Ingresa tu contraseña para vincularla a tu inicio de sesión con Google.`,
            duration: 8000,
        });
      } else {
        toast({ variant: "destructive", title: "Error de Autenticación", description: error.message });
      }
    } finally {
      setIsProcessingLogin(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForSignIn || !password || !pendingCred) return;

    setIsProcessingLogin(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, emailForSignIn, password);
      await linkWithCredential(user, pendingCred);
      await handleSuccessfulLogin(user);
      toast({ title: '¡Cuentas vinculadas!', description: 'Ahora puedes iniciar sesión con Google directamente.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Vincular', description: 'La contraseña es incorrecta. Inténtalo de nuevo o restablece tu contraseña.' });
    } finally {
      setIsProcessingLogin(false);
    }
  };
  
  const handlePasswordReset = () => {
      if (!emailForSignIn) return;
      sendPasswordResetEmail(auth, emailForSignIn)
        .then(() => {
            toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.' });
        })
        .catch((error) => {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el correo de restablecimiento.' });
        });
  };

  const isLoginDisabled = isLoadingAuth || isProcessingLogin;

  return (
    <div className="relative w-full h-screen flex items-center justify-center p-4">
      <Image src="https://i.postimg.cc/sXwFcprc/welcome-bg-png.png" alt="Fondo de bienvenida" fill quality={90} priority className="object-cover -z-20" />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <div className="w-full max-w-sm text-center bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10">
        <div className="relative w-48 h-24 mx-auto mb-6">
          <Image src="https://i.postimg.cc/YSNBv5DT/logo-light-png.png" alt="Corabo logo" fill priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain" />
        </div>

        {uiState === 'google-only' && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Conecta. Colabora. Crece.</h1>
            <p className="text-muted-foreground mt-2">La plataforma para realizar proyectos de forma segura y eficiente.</p>
            <div className="space-y-4 mt-8">
              <Button size="lg" className="w-full bg-white text-gray-800 hover:bg-gray-200" onClick={handleGoogleLogin} disabled={isLoginDisabled}>
                {isLoginDisabled ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <GoogleIcon className="w-6 h-6 mr-2" />}
                Ingresar con Google
              </Button>
            </div>
          </>
        )}

        {uiState === 'linking-account' && (
          <>
            <h1 className="text-xl font-bold">Vincular Cuenta</h1>
            <p className="text-muted-foreground mt-2 text-sm">Ingresa la contraseña de tu cuenta <span className='font-semibold text-foreground'>{emailForSignIn}</span> para conectarla con Google.</p>
            <form onSubmit={handleLinkAccount} className="space-y-4 mt-6">
              <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="email" value={emailForSignIn} className="pl-10 bg-muted" readOnly disabled />
              </div>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoginDisabled}>
                {isLoginDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vincular y Continuar
              </Button>
            </form>
            <div className='mt-4 text-center'>
                 <Button variant="link" className="text-xs h-auto p-0" onClick={() => setUiState('google-only')}>Cancelar</Button>
                 <span className="mx-2 text-xs text-muted-foreground">|</span>
                 <Button variant="link" className="text-xs h-auto p-0" onClick={handlePasswordReset}>¿Olvidaste tu contraseña?</Button>
            </div>
          </>
        )}

        <p className="px-8 text-center text-xs text-muted-foreground mt-10">
          Al continuar, aceptas nuestros{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Términos de Servicio</Link>{' y '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Política de Privacidad</Link>.
        </p>
      </div>
    </div>
  );
}
