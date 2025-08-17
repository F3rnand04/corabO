
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSetupData } from '@/lib/types';

// Import specialized field components
import { HealthFields } from '../specialized-fields/HealthFields';
import { TransportFields } from '../specialized-fields/TransportFields';
import { GeneralProviderFields } from '../specialized-fields/GeneralProviderFields';
import { HomeRepairFields } from '../specialized-fields/HomeRepairFields';
import { FoodAndRestaurantFields } from '../specialized-fields/FoodAndRestaurantFields';
import { BeautyFields } from '../specialized-fields/BeautyFields';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';


function DetailsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold ml-4">Editar Detalles del Perfil</h1>
                </div>
            </div>
        </header>
    );
}


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
    if (!currentUser) return null;

    const props = { formData, onSpecializedChange: handleSpecializedInputChange };
    const professionalServicesCategories = ['Tecnología y Soporte', 'Educación', 'Eventos'];

    if (professionalServicesCategories.includes(formData.primaryCategory || '')) {
      return <GeneralProviderFields {...props} />;
    }

    switch (formData.primaryCategory) {
      case 'Transporte y Asistencia': return <TransportFields {...props} />;
      case 'Salud y Bienestar': return <HealthFields {...props} />;
      case 'Hogar y Reparaciones': return <HomeRepairFields {...props} />;
      case 'Alimentos y Restaurantes': return <FoodAndRestaurantFields {...props} />;
      case 'Belleza': return <BeautyFields {...props} />;
      default:
        return (
          <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
            No hay detalles especializados para esta categoría aún.
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center pt-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DetailsHeader />
      <main className="container max-w-2xl mx-auto py-8">
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
      </main>
    </>
  );
}
