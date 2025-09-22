'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Edit } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { becomeProvider } from '@/lib/actions/user.actions';

interface StepProps {
  formData: Partial<ProfileSetupData>;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
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


export default function Step6_Review({ formData, onUpdate, onSubmit, isSubmitting }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 6: Revisión Final</CardTitle>
        <CardDescription>Revisa que toda la información sea correcta. Al confirmar, tu perfil de proveedor se activará.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReviewItem label="Tipo de Perfil" value={formData.providerType} />
        <ReviewItem label="Especialidad Principal" value={formData.specialty} />
        <ReviewItem label="Oferta Principal" value={formData.offerType} />
        <Separator />
        <ReviewItem label="Categorías" value={formData.categories} />
        <Separator />
        <ReviewItem label="Ubicación" value={formData.location} />
        <ReviewItem label="Radio de Servicio" value={`${formData.serviceRadius || 'N/A'} km`} />
      </CardContent>
      <CardFooter>
        <Button onClick={onSubmit} className="w-full" disabled={isSubmitting}>
          <Check className="mr-2 h-4 w-4"/>
          Confirmar y Activar Perfil
        </Button>
      </CardFooter>
    </Card>
  );
}
