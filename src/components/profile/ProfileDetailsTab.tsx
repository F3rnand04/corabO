'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSetupData } from '@/lib/types';

// Import specialized field components
import { HealthFields } from './specialized-fields/HealthFields';
import { TransportFields } from './specialized-fields/TransportFields';
import { GeneralProviderFields } from './specialized-fields/GeneralProviderFields';
import { HomeRepairFields } from './specialized-fields/HomeRepairFields';
import { FoodAndRestaurantFields } from './specialized-fields/FoodAndRestaurantFields';
import { BeautyFields } from './specialized-fields/BeautyFields';
import { AutomotiveFields } from './specialized-fields/AutomotiveFields';

// Mapa de componentes para un renderizado limpio y sin errores
const categoryComponentMap: { [key: string]: React.ElementType } = {
    'Transporte y Asistencia': TransportFields,
    'Salud y Bienestar': HealthFields,
    'Hogar y Reparaciones': HomeRepairFields,
    'Alimentos y Restaurantes': FoodAndRestaurantFields,
    'Belleza': BeautyFields,
    'Automotriz y Repuestos': AutomotiveFields,
    'Tecnología y Soporte': GeneralProviderFields,
    'Educación': GeneralProviderFields,
    'Eventos': GeneralProviderFields,
};


export function ProfileDetailsTab() {
  const { currentUser, updateUser } = useCorabo();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileSetupData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(currentUser.profileSetupData);
    }
  }, [currentUser]);

  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      specializedData: {
        ...(prev.specializedData || {}),
        [field]: value,
      },
    }));
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
        await updateUser(currentUser.id, {
            profileSetupData: {
                ...currentUser.profileSetupData,
                ...formData,
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

  const renderSpecializedFields = () => {
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Selecciona una categoría principal en tu perfil para ver los campos especializados.
            </div>
        );
    }
    
    const SpecializedComponent = categoryComponentMap[category];
    
    // **FIX**: If a component is mapped, render it. Otherwise, render the general one.
    if (SpecializedComponent) {
        return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
    }

    // Fallback for categories without a specific component yet or general ones
    return <GeneralProviderFields formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center pt-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles Especializados</CardTitle>
        <CardDescription>
          Añade información técnica sobre tus servicios. Estos datos opcionales ayudan a los clientes a entender mejor tu oferta y generan más confianza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderSpecializedFields()}
        <Button onClick={handleSave} disabled={isLoading} className="w-full mt-6">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
          Guardar Detalles
        </Button>
      </CardContent>
    </Card>
  );
}
