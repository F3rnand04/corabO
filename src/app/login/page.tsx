
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, currentUser } = useCorabo();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      router.push('/');
    }
  }, [currentUser, router]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="text-center p-8 bg-background rounded-2xl shadow-xl max-w-sm w-full">
        <Image src="https://i.postimg.cc/8zWvkhxS/Sin-t-tulo-3.png" alt="Corabo Logo" width={180} height={60} className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Bienvenido a Corabo</h1>
        <p className="text-muted-foreground mb-8">Conectando tus necesidades con las mejores soluciones.</p>
        <Button onClick={signInWithGoogle} size="lg" className="w-full">
          <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 102.2 279.5 88 248 88c-86.5 0-157.2 70.2-157.2 156.8s70.7 156.8 157.2 156.8c99.9 0 132.3-84.3 134.8-124.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Iniciar Sesión con Google
        </Button>
      </div>
    </div>
  );
}
