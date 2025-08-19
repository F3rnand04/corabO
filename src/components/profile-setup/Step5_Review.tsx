
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';

interface Step5_ReviewProps {
  formData: ProfileSetupData;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ReviewItem = ({ label, value }: { label: string, value?: string | number | boolean | null }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-semibold text-right">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
        </div>
    );
};

export default function Step5_Review({ formData, onSubmit, isSubmitting }: Step5_ReviewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 4: Resumen y Confirmación</h2>
      <p className="text-sm text-muted-foreground">
        Por favor, revisa que toda la información sea correcta antes de guardar.
      </p>
      
      <Card>
        <CardHeader>
            <CardTitle>Resumen del Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <ReviewItem label="Nombre Comercial" value={formData.username} />
            <ReviewItem label="Mostrar Nombre" value={formData.useUsername ? 'Comercial' : 'Razón Social'} />
            <ReviewItem label="Especialidad" value={formData.specialty} />
            <ReviewItem label="Categoría" value={formData.primaryCategory} />
            <ReviewItem label="Tipo de Oferta" value={formData.offerType} />
            <ReviewItem label="Ubicación" value={formData.location} />
            <ReviewItem label="Ofrece Delivery" value={formData.isOnlyDelivery} />
            <ReviewItem label="Radio de Servicio (Km)" value={formData.serviceRadius} />
            <ReviewItem label="Representante Legal" value={formData.legalRepresentative?.name} />
            <ReviewItem label="ID del Representante" value={formData.legalRepresentative?.idNumber} />
        </CardContent>
      </Card>

      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Guardar y Finalizar Configuración'}
      </Button>
    </div>
  );
}
