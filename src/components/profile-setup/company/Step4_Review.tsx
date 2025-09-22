'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface StepProps {
    formData: Partial<ProfileSetupData>;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const ReviewItem = ({ label, value }: { label: string, value?: string | string[] }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium leading-none text-muted-foreground">{label}</p>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1">
          {value.map(v => <Badge key={v} variant="secondary">{v}</Badge>)}
        </div>
      ) : (
        <p className="text-base font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
};


export default function Step4_Review({ formData, onSubmit, isSubmitting }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 4: Revisión Final</CardTitle>
        <CardDescription>Revisa que toda la información de tu empresa sea correcta. Al confirmar, tu perfil de proveedor se activará.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReviewItem label="Razón Social" value={formData.username} />
        <ReviewItem label="Sitio Web" value={formData.website} />
        <ReviewItem label="Especialidad" value={formData.specialty} />
        <Separator />
        <ReviewItem label="Ubicación" value={formData.location} />
        <ReviewItem label="Radio de Servicio" value={`${formData.serviceRadius || 'N/A'} km`} />
        <Separator />
        <ReviewItem label="Nombre Representante Legal" value={formData.legalRepresentative?.name} />
        <ReviewItem label="Cédula Representante Legal" value={formData.legalRepresentative?.idNumber} />
      </CardContent>
      <CardFooter>
        <Button onClick={onSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
          Confirmar y Activar Perfil
        </Button>
      </CardFooter>
    </Card>
  );
}
