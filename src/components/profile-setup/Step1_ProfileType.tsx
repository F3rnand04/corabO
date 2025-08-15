
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, Truck, Building } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import type { ProfileSetupData, User as UserType } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface Step1_ProfileTypeProps {
  onSelect: (type: UserType['type'], providerType?: ProfileSetupData['providerType']) => void;
  currentType: UserType['type'];
  formData: ProfileSetupData;
  onNext: () => void;
}

export default function Step1_ProfileType({ onSelect, currentType, formData, onNext }: Step1_ProfileTypeProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState<UserType['type'] | null>(null);

  const handleSelection = (typeId: UserType['type']) => {
    if (typeId === currentType) {
        onNext();
        return;
    }

    if (currentType && typeId !== currentType) {
        setNextSelection(typeId);
        setIsAlertOpen(true);
    } else {
        onSelect(typeId, 'professional');
        onNext();
    }
  };

  const handleConfirmChange = () => {
    if (nextSelection) {
      onSelect(nextSelection, 'professional');
    }
    setIsAlertOpen(false);
    onNext();
  }
  
  const isChangingToProviderOrRepartidor = (currentType === 'client' && (nextSelection === 'provider' || nextSelection === 'repartidor'));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: ¿Cómo usarás Corabo?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            onClick={() => handleSelection('client')}
            className={cn('cursor-pointer transition-all text-center', currentType === 'client' && 'border-primary ring-2 ring-primary')}
          ><CardHeader><div className="flex flex-col items-center gap-2"><User className="w-10 h-10 text-primary" /><CardTitle>Cliente</CardTitle></div></CardHeader><CardContent><CardDescription>Busca y contrata servicios o productos.</CardDescription></CardContent></Card>
          <Card
            onClick={() => handleSelection('provider')}
            className={cn('cursor-pointer transition-all text-center', currentType === 'provider' && 'border-primary ring-2 ring-primary')}
          ><CardHeader><div className="flex flex-col items-center gap-2"><Briefcase className="w-10 h-10 text-primary" /><CardTitle>Proveedor</CardTitle></div></CardHeader><CardContent><CardDescription>Ofrece productos o servicios a la comunidad.</CardDescription></CardContent></Card>
          <Card
            onClick={() => handleSelection('repartidor')}
            className={cn('cursor-pointer transition-all text-center', currentType === 'repartidor' && 'border-primary ring-2 ring-primary')}
          ><CardHeader><div className="flex flex-col items-center gap-2"><Truck className="w-10 h-10 text-primary" /><CardTitle>Repartidor</CardTitle></div></CardHeader><CardContent><CardDescription>Realiza entregas locales (delivery).</CardDescription></CardContent></Card>
      </div>

      {currentType === 'provider' && (
        <div className="pt-4 space-y-3">
          <Label className="font-semibold">¿Qué tipo de proveedor eres?</Label>
          <RadioGroup 
            value={formData.providerType || 'professional'} 
            onValueChange={(value: 'professional' | 'company') => onSelect(currentType, value)} 
            className="flex gap-4"
          >
              <div className="flex items-center space-x-2"><RadioGroupItem value="professional" id="professional" /><Label htmlFor="professional" className="flex items-center gap-2 font-normal cursor-pointer"><User className="w-4 h-4"/> Profesional Independiente</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="company" id="company" /><Label htmlFor="company" className="flex items-center gap-2 font-normal cursor-pointer"><Building className="w-4 h-4"/> Empresa</Label></div>
          </RadioGroup>
        </div>
      )}
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isChangingToProviderOrRepartidor ? '¡Felicidades por dar el siguiente paso!' : '¿Cambiar tipo de perfil?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isChangingToProviderOrRepartidor
                ? "Estás a punto de convertirte en una parte activa de nuestra comunidad de servicios. ¿Estás listo para empezar a ofrecer tus talentos? (Este cambio solo puede realizarse una vez cada 6 meses)."
                : "La información específica de tu perfil actual podría no ser visible en el nuevo tipo. En la versión real, este cambio solo puede realizarse una vez cada 6 meses. ¿Deseas continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
