
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { allCategories } from "@/lib/data/options";
import type { ProfileSetupData } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface Step2_CompanyInfoProps {
  formData: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step2_CompanyInfo({ formData, onUpdate, onNext }: Step2_CompanyInfoProps) {

  const canContinue = formData.username && formData.specialty && formData.primaryCategory;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: Detalles del Negocio</h2>
      <div className="space-y-2">
        <Label htmlFor="username">Nombre Comercial / de Fantasía</Label>
        <Input 
          id="username"
          value={formData.username || ''}
          onChange={(e) => onUpdate({ username: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>¿Qué nombre mostrar en tu perfil público?</Label>
        <RadioGroup
          value={formData.useUsername ? 'username' : 'legal_name'}
          onValueChange={(value) => onUpdate({ useUsername: value === 'username' })}
          className="flex gap-4"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="username" id="use_username" />
                <Label htmlFor="use_username" className="font-normal">Nombre Comercial</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal_name" id="use_legal_name" />
                <Label htmlFor="use_legal_name" className="font-normal">Razón Social</Label>
            </div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad / Eslogan</Label>
        <Textarea 
          id="specialty"
          placeholder="Ej: La mejor comida italiana de la ciudad"
          value={formData.specialty || ''}
          onChange={(e) => onUpdate({ specialty: e.target.value })}
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="category">Categoría Principal</Label>
        <Select
          value={formData.primaryCategory || ''}
          onValueChange={(value) => onUpdate({ primaryCategory: value })}
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
