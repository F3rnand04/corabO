
'use client';

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ValidationItem } from "@/components/ValidationItem";
import { useCorabo } from "@/contexts/CoraboContext";

interface Step4_GeneralDetailsProps {
  onBack: () => void;
  onNext: () => void;
}

export default function Step4_GeneralDetails({ onBack, onNext }: Step4_GeneralDetailsProps) {
  const { currentUser } = useCorabo();

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold">Paso 4: Detalles Generales</h2>
        
        <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="font-semibold text-lg">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">Este es el nombre asociado a tu cuenta y no puede ser modificado.</p>
            </div>

            <ValidationItem
                label="Correo Electrónico:"
                value="usuario@email.com" // Placeholder, should come from context
                initialStatus="idle"
            />
             <ValidationItem
                label="Teléfono:"
                value="0412-1234567" // Placeholder
                initialStatus="idle"
            />
        </div>
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>¡Aumenta tu confianza!</AlertTitle>
            <AlertDescription>
                Valida tus datos para mejorar tu <strong>reputación, efectividad y credibilidad</strong> en la plataforma.
                Tu número de teléfono es para uso interno y <strong>nunca</strong> se compartirá con otros usuarios.
            </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Atrás</Button>
            <Button onClick={onNext}>Siguiente</Button>
        </div>
    </div>
  );
}
