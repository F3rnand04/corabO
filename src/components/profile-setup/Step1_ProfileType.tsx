
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, Truck, Building } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import type { ProfileSetupData, User as UserType } from '@/lib/types';


interface Step1_ProfileTypeProps {
  onSelect: (type: UserType['type'], providerType?: ProfileSetupData['providerType']) => void;
  currentType: UserType['type'];
  onNext: () => void;
}

const profileTypes = [
  { id: 'client', name: 'Cliente', description: 'Busca y contrata servicios o productos.', icon: User },
  { id: 'provider', name: 'Proveedor', description: 'Ofrece productos, servicios o fletes a la comunidad.', icon: Briefcase },
  { id: 'repartidor', name: 'Repartidor', description: 'Realiza entregas locales (delivery) para otros proveedores.', icon: Truck },
];

export default function Step1_ProfileType({ onSelect, currentType, onNext }: Step1_ProfileTypeProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState<UserType['type'] | null>(null);
  const [providerTypeSelection, setProviderTypeSelection] = useState<ProfileSetupData['providerType']>('professional');

  const handleSelection = (typeId: UserType['type']) => {
    if (typeId === currentType) {
        onNext();
        return;
    }

    if (currentType && typeId !== currentType) {
        setNextSelection(typeId);
        setIsAlertOpen(true);
    } else {
        onSelect(typeId, providerTypeSelection);
        onNext();
    }
  };

  const handleConfirmChange = () => {
    if (nextSelection) {
      onSelect(nextSelection, providerTypeSelection);
    }
    setIsAlertOpen(false);
    onNext();
  }
  
  const isChangingToProviderOrRepartidor = (currentType === 'client' && (nextSelection === 'provider' || nextSelection === 'repartidor'));

  const handleProviderTypeSelect = (type: ProfileSetupData['providerType']) => {
    setProviderTypeSelection(type);
    onSelect('provider', type);
  }

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
      
      {currentType === 'provider' && (
        <div className="pt-6 space-y-4">
            <h3 className="font-semibold text-center">Como proveedor, ¿eres...</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    onClick={() => handleProviderTypeSelect('professional')}
                    className={cn('cursor-pointer transition-all text-center', providerTypeSelection === 'professional' && 'border-primary ring-2 ring-primary')}
                >
                    <CardHeader>
                        <User className="w-8 h-8 mx-auto text-primary"/>
                        <CardTitle className="text-base">Profesional Independiente</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Una persona natural que ofrece sus servicios.</CardContent>
                </Card>
                <Card
                    onClick={() => handleProviderTypeSelect('company')}
                    className={cn('cursor-pointer transition-all text-center', providerTypeSelection === 'company' && 'border-primary ring-2 ring-primary')}
                >
                    <CardHeader>
                         <Building className="w-8 h-8 mx-auto text-primary"/>
                        <CardTitle className="text-base">Empresa / Persona Jurídica</CardTitle>
                    </CardHeader>
                     <CardContent className="text-xs text-muted-foreground">Una entidad legalmente constituida (C.A., S.A., etc.).</CardContent>
                </Card>
            </div>
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

