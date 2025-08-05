
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, Building } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import type { ProfileSetupData } from '@/lib/types';

interface Step1_ProfileTypeProps {
  onSelect: (type: 'client' | 'provider', providerType?: ProfileSetupData['providerType']) => void;
  currentType: 'client' | 'provider';
}

const profileTypes = [
  { id: 'client', name: 'Cliente', description: 'Busca servicios y productos.', icon: User, providerType: undefined },
  { id: 'provider_service', name: 'Servicio', description: 'Ofrece tus habilidades como profesional.', icon: Briefcase, providerType: 'professional' as const },
  { id: 'provider_company', name: 'Empresa', description: 'Registra tu negocio y ofrece servicios/productos.', icon: Building, providerType: 'company' as const },
];

export default function Step1_ProfileType({ onSelect, currentType }: Step1_ProfileTypeProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState<{ type: 'client' | 'provider', providerType?: ProfileSetupData['providerType'] } | null>(null);

  const handleSelection = (typeId: string) => {
    const selected = profileTypes.find(t => t.id === typeId)!;
    const newTypeForBackend = typeId.startsWith('provider') ? 'provider' : 'client';
    
    if (currentType && newTypeForBackend !== currentType) {
        setNextSelection({ type: newTypeForBackend, providerType: selected.providerType });
        setIsAlertOpen(true);
    } else {
        onSelect(newTypeForBackend, selected.providerType);
    }
  };

  const handleConfirmChange = () => {
    if (nextSelection) {
      onSelect(nextSelection.type, nextSelection.providerType);
    }
    setIsAlertOpen(false);
  }

  const getMappedCurrentType = () => {
      // This is a simplification. A real app would need a more robust way to map this.
      // For now, let's assume 'provider' maps to 'Servicio' for display.
      return currentType === 'client' ? 'client' : 'provider_service';
  }
  
  const isChangingToProvider = currentType === 'client' && nextSelection?.type === 'provider';


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 1: Elige tu tipo de perfil</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileTypes.map((type) => (
          <Card
            key={type.id}
            onClick={() => handleSelection(type.id)}
            className={cn(
              'cursor-pointer transition-all',
              (getMappedCurrentType() === type.id) 
              ? 'border-primary ring-2 ring-primary' 
              : 'hover:border-primary/50'
            )}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <type.icon className="w-8 h-8 text-primary" />
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
