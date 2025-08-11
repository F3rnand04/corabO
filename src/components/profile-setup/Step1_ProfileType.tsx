
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import type { ProfileSetupData } from '@/lib/types';

interface Step1_ProfileTypeProps {
  onSelect: (type: 'client' | 'provider', providerType?: ProfileSetupData['providerType']) => void;
  currentType: 'client' | 'provider';
}

const profileTypes = [
  { id: 'client', name: 'Cliente', description: 'Busca y contrata servicios o productos.', icon: User },
  { id: 'provider', name: 'Proveedor', description: 'Ofrece productos o servicios a la comunidad.', icon: Briefcase },
];

export default function Step1_ProfileType({ onSelect, currentType }: Step1_ProfileTypeProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState<'client' | 'provider' | null>(null);

  const handleSelection = (typeId: 'client' | 'provider') => {
    if (currentType && typeId !== currentType) {
        setNextSelection(typeId);
        setIsAlertOpen(true);
    } else {
        onSelect(typeId, 'professional'); // Default providerType
    }
  };

  const handleConfirmChange = () => {
    if (nextSelection) {
      onSelect(nextSelection, 'professional');
    }
    setIsAlertOpen(false);
  }
  
  const isChangingToProvider = currentType === 'client' && nextSelection === 'provider';


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: ¿Cómo usarás Corabo?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profileTypes.map((type) => (
          <Card
            key={type.id}
            onClick={() => handleSelection(type.id as 'client' | 'provider')}
            className={cn(
              'cursor-pointer transition-all text-center',
              (currentType === type.id) 
              ? 'border-primary ring-2 ring-primary' 
              : 'hover:border-primary/50'
            )}
          >
            <CardHeader>
              <div className="flex flex-col items-center gap-2">
                <type.icon className="w-10 h-10 text-primary" />
                <CardTitle>{type.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{type.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isChangingToProvider ? '¡Felicidades por dar el siguiente paso!' : '¿Cambiar tipo de perfil?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isChangingToProvider
                ? "Al convertirte en proveedor, podrás crear tu propia vitrina de servicios o productos. ¿Estás listo para empezar a ofrecer tus talentos? (Este cambio solo puede realizarse una vez cada 6 meses)."
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
