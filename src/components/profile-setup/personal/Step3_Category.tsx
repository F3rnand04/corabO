
'use client';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { allCategories } from "@/lib/data/options";
import type { ProfileSetupData } from '@/lib/types';
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";

interface Step3CategoryProps {
  formData: Partial<ProfileSetupData>;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step3Category({ formData, onUpdate, onNext }: Step3CategoryProps) {
  
  const canContinue = formData.specialty && formData.primaryCategory && formData.offerType;
  const { setCurrentUser } = useAuth();

  const handleUpdate = (data: Partial<ProfileSetupData>) => {
      setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
      onUpdate(data);
  }

  return (
    <div className="space-y-6">
       <h2 className="text-xl font-semibold">Paso 3: Define tu Servicio</h2>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría Principal</Label>
        <Select
          value={formData.primaryCategory || ''}
          onValueChange={(value) => handleUpdate({ primaryCategory: value })}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecciona la categoría de tu servicio" />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad / Eslogan</Label>
        <Textarea 
          id="specialty"
          placeholder="Ej: El mejor fisioterapeuta de la ciudad"
          value={formData.specialty || ''}
          onChange={(e) => handleUpdate({ specialty: e.target.value })}
        />
      </div>
       <div className="space-y-2">
        <Label>¿Qué ofreces principalmente?</Label>
        <div className="flex gap-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="offer_product" checked={formData.offerType === 'product' || formData.offerType === 'both'} onCheckedChange={(checked) => handleUpdate({ offerType: checked ? (formData.offerType === 'service' ? 'both' : 'product') : (formData.offerType === 'both' ? 'service' : undefined) })} />
                <Label htmlFor="offer_product" className="font-normal">Productos</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="offer_service" checked={formData.offerType === 'service' || formData.offerType === 'both'} onCheckedChange={(checked) => handleUpdate({ offerType: checked ? (formData.offerType === 'product' ? 'both' : 'service') : (formData.offerType === 'both' ? 'product' : undefined) })} />
                <Label htmlFor="offer_service" className="font-normal">Servicios</Label>
            </div>
        </div>
      </div>
       <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Siguiente
      </Button>
    </div>
  );
}
