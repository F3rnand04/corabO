
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCorabo } from "@/hooks/use-corabo";
import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivationWarningProps {
  userType: 'client' | 'provider' | 'repartidor';
}

export function ActivationWarning({ userType }: ActivationWarningProps) {
  const { currentUser } = useCorabo();
  const router = useRouter();

  if (!currentUser) return null;

  const handleActivationClick = () => {
    if (currentUser.isPaused) {
        router.push('/transactions/settings');
        return;
    }
    
    // For companies, the first step after initial setup is the multi-step profile setup.
    if (currentUser.profileSetupData?.providerType === 'company' && !currentUser.profileSetupData?.specialty) {
        router.push('/profile-setup');
        return;
    }
    
    if (!currentUser.isInitialSetupComplete) {
      router.push('/initial-setup');
    } else if (currentUser.idVerificationStatus !== 'verified') {
      router.push('/profile-setup/verify-id');
    } else {
      router.push('/transactions/settings');
    }
  };

  const isPaused = currentUser?.isPaused;
  const pausedMessages = {
    title: "¡Tu cuenta está en pausa!",
    description: "Debido a inactividad, algunas funciones han sido desactivadas. Actívalas de nuevo.",
    buttonText: "Reactivar Registro"
  }

  const defaultMessages = {
    client: {
      title: "¡Activa tu registro!",
      description: "Disfruta de compras seguras y con seguimiento.",
      buttonText: "Activar ahora",
    },
    provider: {
      title: "¡Activa tu registro!",
      description: "Empieza a recibir pagos y a gestionar tus ingresos de forma segura.",
      buttonText: "Activar ahora",
    },
    repartidor: {
        title: "¡Activa tu registro!",
        description: "Completa tu perfil para poder aceptar entregas.",
        buttonText: "Activar ahora",
    }
  }

  const { title, description, buttonText } = isPaused ? pausedMessages : (defaultMessages[userType] || defaultMessages.client);
  const Icon = isPaused ? RotateCcw : AlertCircle;


  return (
     <Alert>
        <Icon className="h-4 w-4" />
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
            <span>{description}</span>
            <Button variant="link" size="sm" onClick={handleActivationClick} className="p-0 h-auto text-current font-bold">
              {buttonText} &rarr;
            </Button>
        </AlertDescription>
    </Alert>
  );
}
