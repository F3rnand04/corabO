
'use client';

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Package, Save, Truck, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSetupData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function ProfileDetailsTab() {
  const { currentUser, updateUser } = useCorabo();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileSetupData['specializedData']>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData?.specializedData) {
      setFormData(currentUser.profileSetupData.specializedData);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="flex items-center justify-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
        await updateUser(currentUser.id, {
            profileSetupData: {
                ...currentUser.profileSetupData,
                specializedData: formData,
            }
        });
        toast({ title: "Detalles Guardados", description: "Tu información especializada ha sido actualizada." });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
        setIsLoading(false);
    }
  };

  const renderTransportFields = () => (
    <div className="space-y-4">
       <div className="space-y-2">
            <Label htmlFor="vehicleType" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Tipo de Vehículo</Label>
            <Input 
                id="vehicleType" 
                placeholder="Ej: Camión 350, Grúa de Plataforma" 
                value={formData?.vehicleType || ''}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2"><Package className="w-4 h-4"/> Capacidad de Carga</Label>
            <Input 
                id="capacity" 
                placeholder="Ej: 3,500 Kg, 2 vehículos" 
                value={formData?.capacity || ''}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
            />
        </div>
         <div className="space-y-2">
            <Label htmlFor="specialConditions" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Equipos o Condiciones Especiales</Label>
            <Textarea
                id="specialConditions"
                placeholder="Ej: Rampa hidráulica, GPS, Cava refrigerada..."
                value={formData?.specialConditions || ''}
                onChange={(e) => handleInputChange('specialConditions', e.target.value)}
                rows={3}
            />
        </div>
    </div>
  );

  const renderContent = () => {
    switch (currentUser.profileSetupData?.primaryCategory) {
      case 'Transporte y Asistencia':
        return renderTransportFields();
      default:
        return (
            <Alert>
                <AlertTitle>Sección en Desarrollo</AlertTitle>
                <AlertDescription>
                    Próximamente añadiremos campos especializados para tu categoría. Por ahora, puedes usar tu descripción de perfil para detallar tus servicios.
                </AlertDescription>
            </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles Especializados</CardTitle>
        <CardDescription>
          Añade información técnica sobre tus servicios. Esto ayuda a los clientes a entender mejor tu oferta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderContent()}
        <Button onClick={handleSave} disabled={isLoading} className="w-full mt-6">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
            Guardar Detalles
        </Button>
      </CardContent>
    </Card>
  );
}
