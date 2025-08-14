
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface ActivationWarningProps {
  userType: 'client' | 'provider' | 'repartidor';
}

export function ActivationWarning({ userType }: ActivationWarningProps) {

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
            <Button variant="link" size="sm" asChild className="p-0 h-auto text-current font-bold">
              <Link href="/initial-setup">Activar ahora &rarr;</Link>
            </Button>
        </AlertDescription>
    </Alert>
  );
}
