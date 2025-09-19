
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { checkIdUniqueness, completeInitialSetup } from '@/lib/actions/user.actions';
import { useAuth } from '@/hooks/use-auth-provider';
import InitialSetupForm from '@/components/profile-setup/InitialSetupForm';
import { Loader2 } from 'lucide-react';

export default function InitialSetupPage() {
  const { firebaseUser, isLoadingAuth } = useAuth(); 
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // If auth is loading, or we don't have a firebaseUser yet, show a loader.
  // The AuthProvider will handle redirecting away if the user is not authenticated.
  if (isLoadingAuth || !firebaseUser) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="ml-4">Cargando datos de usuario...</p>
          </div>
      );
  }
  
  const handleSubmit = async (data: any) => {
    if (!firebaseUser) return;
    setIsSubmitting(true);

    try {
        const isUnique = await checkIdUniqueness({ idNumber: data.idNumber, country: data.country, currentUserId: firebaseUser.uid });
        
        if (!isUnique) {
            toast({
                variant: 'destructive',
                title: 'Documento en Uso',
                description: 'El número de documento ya está registrado. Si crees que es un error, contacta a soporte.',
            });
            setIsSubmitting(false);
            return; 
        }
        
        await completeInitialSetup(firebaseUser.uid, data);
        
        toast({ title: "Perfil Guardado", description: "Tus datos han sido guardados. Serás redirigido."});
        // The AuthProvider will detect the state change and the main page component will handle the redirect.
        // We can force a reload to ensure all states are fresh.
        window.location.href = '/';

    } catch (error: any) {
        console.error("Failed to complete setup:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar tu información. Inténtalo de nuevo.'
        });
        setIsSubmitting(false);
    }
  };

  return <InitialSetupForm user={firebaseUser} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}
