'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, ChevronLeft, Wrench, Clock, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSetupData } from '@/lib/types';
import { HealthFields } from '@/components/profile/specialized-fields/HealthFields';
import { TransportFields } from '@/components/profile/specialized-fields/TransportFields';
import { GeneralProviderFields } from '@/components/profile/specialized-fields/GeneralProviderFields';
import { HomeRepairFields } from '@/components/profile/specialized-fields/HomeRepairFields';
import { FoodAndRestaurantFields } from '@/components/profile/specialized-fields/FoodAndRestaurantFields';
import { BeautyFields } from '@/components/profile/specialized-fields/BeautyFields';
import { AutomotiveFields } from '@/components/profile/specialized-fields/AutomotiveFields';

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

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function DetailsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold ml-4 flex items-center gap-2">
                        <Settings className="w-5 h-5"/>
                        Editar Detalles y Horarios
                    </h1>
                </div>
            </div>
        </header>
    );
}

export default function DetailsPage() {
  const { currentUser, updateUser } = useCorabo();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileSetupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
        setFormData(currentUser.profileSetupData || {});
        setIsLoading(false);
    }
  }, [currentUser]);

  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
    setFormData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          specializedData: {
            ...(prev.specializedData || {}),
            [field]: value,
          },
      }});
  }, []);

  const handleScheduleChange = useCallback((day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    setFormData(prev => {
        if (!prev) return null;
        const currentSchedule = prev.schedule || {};
        const newSchedule = { ...currentSchedule, [day]: { ...(currentSchedule[day] || {}), [field]: value } };
        return { ...prev, schedule: newSchedule };
    });
  }, []);

  const handleSave = async () => {
    if (!currentUser || !formData) return;
    setIsSaving(true);
    try {
        // Merge with existing data to avoid overwriting other parts of profileSetupData
        const dataToSave = {
            ...currentUser.profileSetupData,
            ...formData
        };
        await updateUser(currentUser.id, { profileSetupData: dataToSave });
        toast({ title: "Cambios Guardados", description: "Tu información ha sido actualizada." });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
        setIsSaving(false);
    }
  };

  const renderSpecializedFields = () => {
    if (!formData) return null;
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Para añadir detalles, primero selecciona una categoría principal en la configuración de tu perfil.
            </div>
        );
    }
    const SpecializedComponent = categoryComponentMap[category] || GeneralProviderFields;
    return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };

  if (isLoading || !formData) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    );
  }

  return (
    <>
      <DetailsHeader />
      <main className="container max-w-2xl mx-auto py-8 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5"/>Campos Especializados</CardTitle>
                <CardDescription>Añade información técnica sobre tus servicios para que los clientes te encuentren más fácil.</CardDescription>
            </CardHeader>
            <CardContent>
                 {renderSpecializedFields()}
            </CardContent>
        </Card>
        
         <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                   <CardHeader className="p-0 text-left">
                       <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/>Horarios de Atención</CardTitle>
                       <CardDescription>Define tu horario laboral para que los clientes sepan cuándo estás disponible.</CardDescription>
                   </CardHeader>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                    <div className="space-y-3 pt-4 border-t">
                        {daysOfWeek.map(day => (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                    <Switch id={`switch-${day}`} checked={formData.schedule?.[day]?.active ?? false} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} />
                                    <Label htmlFor={`switch-${day}`} className="w-24">{day}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input type="time" value={formData.schedule?.[day]?.from || '09:00'} onChange={(e) => handleScheduleChange(day, 'from', e.target.value)} className="w-full sm:w-auto"/>
                                    <span>-</span>
                                    <Input type="time" value={formData.schedule?.[day]?.to || '17:00'} onChange={(e) => handleScheduleChange(day, 'to', e.target.value)} className="w-full sm:w-auto"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
          Guardar Cambios
        </Button>
      </main>
    </>
  );
}
