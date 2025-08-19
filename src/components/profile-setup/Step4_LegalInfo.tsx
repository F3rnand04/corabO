
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileSetupData } from '@/lib/types';

interface Step4_LegalInfoProps {
  formData: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step4_LegalInfo({ formData, onUpdate, onNext }: Step4_LegalInfoProps) {
  
  const handleRepresentativeChange = (field: 'name' | 'idNumber' | 'phone', value: string) => {
    onUpdate({
      legalRepresentative: {
        ...(formData.legalRepresentative || { name: '', idNumber: '', phone: '' }),
        [field]: value
      }
    });
  };
  
  const canContinue = formData.legalRepresentative?.name && formData.legalRepresentative?.idNumber;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 3: Información Legal</h2>
      <p className="text-sm text-muted-foreground">
        Introduce los datos de la persona que representa legalmente a la empresa. Esta información es confidencial.
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="rep_name">Nombre y Apellido del Representante</Label>
            <Input id="rep_name" value={formData.legalRepresentative?.name || ''} onChange={(e) => handleRepresentativeChange('name', e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="rep_id">Cédula / ID del Representante</Label>
            <Input id="rep_id" value={formData.legalRepresentative?.idNumber || ''} onChange={(e) => handleRepresentativeChange('idNumber', e.target.value)} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="rep_phone">Teléfono de Contacto del Representante</Label>
            <Input id="rep_phone" type="tel" value={formData.legalRepresentative?.phone || ''} onChange={(e) => handleRepresentativeChange('phone', e.target.value)} />
        </div>
      </div>
      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Revisar y Finalizar
      </Button>
    </div>
  );
}
