
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import InitialSetupForm from '@/components/profile-setup/InitialSetupForm';
import type { User, ProfileSetupData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import GoogleIcon from '@/components/GoogleIcon';
import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from '@/app/AppLayout';
import { completeInitialSetup } from '@/lib/actions/user.actions';


function WelcomeScreen() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLoginClick = () => {
        setIsLoggingIn(true);
        // Redirige al usuario al endpoint de nuestra API que inicia el flujo OAuth
        window.location.href = '/api/auth/google';
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full object-cover bg-cover bg-center" style={{ backgroundImage: "url('https://i.postimg.cc/sXwFcprc/welcome-bg-png.png')" }} data-ai-hint="background office" />
            <div className="absolute inset-0 bg-background/50" />

            <div className="relative z-10 flex flex-col items-center bg-background/80 p-8 rounded-xl shadow-2xl w-full max-w-sm">
                <img src="https://i.postimg.cc/YSNBv5DT/logo-light-png.png" alt="Corabo Logo" className="h-36 mb-6" />

                <p className="text-muted-foreground text-lg mb-8">Tu nuevo ecosistema de confianza. Aquí, profesionales y clientes se encuentran para hacer negocios de forma segura, transparente y flexible. ¿Listo para crecer?</p>

                <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full" 
                    onClick={handleLoginClick} 
                    disabled={isLoggingIn}
                >
                   {isLoggingIn ? (
                       <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   ) : (
                       <GoogleIcon className="mr-2 h-5 w-5" />
                   )}
                    {isLoggingIn ? 'Accediendo...' : 'Entrar o Regístrate con Google'}
                </Button>
            </div>
        </div>
    );
}

function InitialSetup() {
    const { currentUser, setCurrentUser } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!currentUser) return null;

    const handleSubmitSetup = async (data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }) => {
        setIsSubmitting(true);
        try {
            const updatedUser = await completeInitialSetup(currentUser.id, data);
            
            setCurrentUser(updatedUser);

            toast({
                title: "¡Registro Completado!",
                description: "Tus datos han sido guardados exitosamente.",
            });
        } catch (error: any) {
            console.error("Error submitting initial setup:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: error.message || "No se pudo completar el registro. Por favor, inténtalo de nuevo.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="bg-muted/30 min-h-screen flex items-center justify-center p-4">
            <InitialSetupForm
                user={currentUser}
                onSubmit={handleSubmitSetup}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}


export default function HomePage() {
  const { isLoadingAuth, currentUser } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <WelcomeScreen />;
  }

  if (!currentUser.isInitialSetupComplete) {
    return <InitialSetup />;
  }
  
  return (
    <AppLayout>
      <FeedClientComponent />
    </AppLayout>
  );
}
