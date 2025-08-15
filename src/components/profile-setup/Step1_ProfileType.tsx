
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, Truck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import type { ProfileSetupData, User as UserType } from '@/lib/types';
import { useCorabo } from '@/contexts/CoraboContext';


interface Step1_ProfileTypeProps {
  onSelect: (type: UserType['type'], providerType?: ProfileSetupData['providerType']) => void;
  currentType: UserType['type'];
  onNext: () => void;
}

const profileTypes = [
  { id: 'client', name: 'Cliente', description: 'Busca y contrata servicios o productos.', icon: User },
  { id: 'provider', name: 'Proveedor', description: 'Ofrece productos, servicios o fletes a la comunidad.', icon: Briefcase },
  { id: 'repartidor', name: 'Repartidor', description: 'Realiza entregas locales (delivery).', icon: Truck },
];

export default function Step1_ProfileType({ onSelect, currentType, onNext }: Step1_ProfileTypeProps) {
  const { currentUser } = useCorabo();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState<UserType['type'] | null>(null);

  // Infer providerType from initial setup data
  const providerType = currentUser?.profileSetupData?.providerType || 'professional';

  const handleSelection = (typeId: UserType['type']) => {
    if (typeId === currentType) {
        onNext();
        return;
    }

    if (currentType && typeId !== currentType) {
        setNextSelection(typeId);
        setIsAlertOpen(true);
    } else {
        onSelect(typeId, providerType);
        onNext();
    }
  };

  const handleConfirmChange = () => {
    if (nextSelection) {
      onSelect(nextSelection, providerType);
    }
    setIsAlertOpen(false);
    onNext();
  }
  
  const isChangingToProviderOrRepartidor = (currentType === 'client' && (nextSelection === 'provider' || nextSelection === 'repartidor'));


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: ¿Cómo usarás Corabo?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileTypes.map((type) => (
          <Card
            key={type.id}
            onClick={() => handleSelection(type.id as UserType['type'])}
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

    