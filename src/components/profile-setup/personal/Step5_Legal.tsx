'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import type { User } from "@/lib/types";

interface StepProps {
  currentUser: User;
  onNext: () => void;
}

const ReviewItem = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium leading-none text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
};

export default function Step5_Legal({ currentUser, onNext }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 5: Representación Legal</CardTitle>
        <CardDescription>Como proveedor individual, tú eres tu propio representante legal. Esta es la información que se utilizará para fines legales y de facturación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-primary"/>
              Tus Datos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewItem label="Nombre Completo" value={`${currentUser.name || ''} ${currentUser.lastName || ''}`.trim()} />
            <ReviewItem label="Documento de Identidad" value={currentUser.idNumber} />
            <ReviewItem label="Teléfono de Contacto" value={currentUser.phone} />
          </CardContent>
        </Card>
        
        <Button onClick={onNext} className="w-full">
          Continuar a Revisión
        </Button>
      </CardContent>
    </Card>
  );
}
