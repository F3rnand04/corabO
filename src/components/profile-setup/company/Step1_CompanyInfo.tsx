
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { allCategories } from "@/lib/data/options";
import type { ProfileSetupData } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";

interface Step1_CompanyInfoProps {
  formData: Partial<ProfileSetupData>;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step1_CompanyInfo({ formData, onUpdate, onNext }: Step1_CompanyInfoProps) {
  const { currentUser } = useAuth();
  
  const useUsername = formData.useUsername ?? false;

  const canContinue = 
    formData.specialty && 
    formData.primaryCategory &&
    (useUsername ? formData.username : true);

  const handleUpdate = (field: keyof ProfileSetupData, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: Detalles del Negocio</h2>
      <div className="space-y-2">
        <Label htmlFor="username">Nombre Comercial</Label>
        <Input 
          id="username"
          placeholder="Ej: Soluciones Globales"
          value={formData.username || ''}
          onChange={(e) => handleUpdate('username', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Nombre a mostrar en el perfil público:</Label>
        <RadioGroup
          value={useUsername ? 'username' : 'legal_name'}
          onValueChange={(value) => handleUpdate('useUsername', value === 'username')}
          className="flex gap-4"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="username" id="use_username" />
                <Label htmlFor="use_username" className="font-normal">Nombre Comercial</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal_name" id="use_legal_name" />
                <Label htmlFor="use_legal_name" className="font-normal">{currentUser?.name || 'Razón Social'}</Label>
            </div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad / Eslogan</Label>
        <Textarea 
          id="specialty"
          placeholder="Ej: La mejor comida italiana de la ciudad"
          value={formData.specialty || ''}
          onChange={(e) => handleUpdate('specialty', e.target.value)}
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="category">Categoría Principal</Label>
        <Select
          value={formData.primaryCategory || ''}
          onValueChange={(value) => handleUpdate('primaryCategory', value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecciona la categoría de tu negocio" />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Siguiente
      </Button>
    </div>
  );
}
