
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
    
    // **FIX**: Implement smart redirection logic
    if (currentUser.isInitialSetupComplete) {
      // If identity is set up, go to payment/transaction settings
      router.push('/transactions/settings');
    } else {
      // Otherwise, go to the initial identity setup
      router.push('/initial-setup');
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
