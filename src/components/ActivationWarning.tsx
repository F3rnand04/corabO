
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivationWarningProps {
  userType: 'client' | 'provider' | 'repartidor';
}

export function ActivationWarning({ userType }: ActivationWarningProps) {
  const { currentUser } = useCorabo();
  const router = useRouter();

  const handleActivationClick = () => {
    if (!currentUser) return;
    
    if (!currentUser.isInitialSetupComplete) {
      // Step 1: Complete identity setup
      router.push('/initial-setup');
    } else if (currentUser.idVerificationStatus !== 'verified') {
      // Step 2: Verify identity document
      router.push('/profile-setup/verify-id');
    } else {
      // Step 3: Configure payment methods
      router.push('/transactions/settings');
    }
  };

  const messages = {
    client: {
      title: "¡Activa tu registro!",
      description: "Disfruta de compras seguras y con seguimiento.",
    },
    provider: {
      title: "¡Activa tu registro!",
      description: "Empieza a recibir pagos y a gestionar tus ingresos de forma segura.",
    },
    repartidor: {
        title: "¡Activa tu registro!",
        description: "Completa tu perfil para poder aceptar entregas.",
    }
  }

  const { title, description } = messages[userType] || messages.client;

  return (
     <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
            <span>{description}</span>
            <Button variant="link" size="sm" onClick={handleActivationClick} className="p-0 h-auto text-current font-bold">
              Activar ahora &rarr;
            </Button>
        </AlertDescription>
    </Alert>
  );
}
