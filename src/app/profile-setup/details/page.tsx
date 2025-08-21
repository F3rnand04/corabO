
'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2, Settings, ChevronLeft, Save, Wrench, Clock, DollarSign, AlertCircle, Home, Briefcase, Car, Scissors, Stethoscope, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as SpecializedFields from '@/components/profile/specialized-fields';
import type { ProfileSetupData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import * as Actions from '@/lib/actions';

// New dedicated header for the focused editing view
function EditDetailsHeader({ onSave, isSaving }: { onSave: () => void; isSaving: boolean }) {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5"/>
                        Editar Detalles del Perfil
                    </h1>
                    <Button variant="ghost" size="icon" onClick={onSave} disabled={isSaving}>
                       {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </header>
    );
}

// Mapa para renderizar el componente de campos especializados correcto
const categoryComponentMap: { [key: string]: React.ElementType } = {
    'Salud y Bienestar': SpecializedFields.HealthFields,
    'Hogar y Reparaciones': SpecializedFields.HomeRepairFields,
    'Alimentos y Restaurantes': SpecializedFields.FoodAndRestaurantFields,
    'Transporte y Asistencia': SpecializedFields.TransportFields,
    'Belleza': SpecializedFields.BeautyFields,
    'Automotriz y Repuestos': SpecializedFields.AutomotiveFields,
    'Tecnología y Soporte': SpecializedFields.GeneralProviderFields,
    'Educación': SpecializedFields.GeneralProviderFields,
    'Eventos': SpecializedFields.GeneralProviderFields,
    'Otros': SpecializedFields.GeneralProviderFields
};

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function DetailsPage() {
  const { currentUser } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileSetupData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(currentUser.profileSetupData);
    }
  }, [currentUser]);

  const handleInputChange = (field: keyof ProfileSetupData, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      setFormData(prev => prev ? ({
          ...prev,
          specializedData: {
              ...(prev.specializedData || {}),
              [field]: value
          }
      }) : null);
  }, []);
  
  const handleScheduleChange = useCallback((day: string, field: 'active' | 'hours', value: boolean | number[]) => {
      setFormData(prev => {
          if (!prev) return null;
          const currentSchedule = prev.schedule || {};
          const daySchedule = currentSchedule[day] || { from: '09:00', to: '17:00', active: false };

          let newDaySchedule;
          if (field === 'active') {
              newDaySchedule = { ...daySchedule, active: value as boolean };
          } else { // field === 'hours'
              const [fromHour, toHour] = value as number[];
              newDaySchedule = { ...daySchedule, from: `${String(fromHour).padStart(2, '0')}:00`, to: `${String(toHour).padStart(2, '0')}:00` };
          }
          
          return { ...prev, schedule: { ...currentSchedule, [day]: newDaySchedule } };
      });
  }, []);

  const handleSaveChanges = async () => {
    if (!currentUser || !formData) return;
    setIsSaving(true);
    try {
        await Actions.updateFullProfile(currentUser.id, formData, currentUser.type);
        toast({ title: "Perfil Actualizado", description: "Tus detalles han sido guardados." });
        router.push('/profile/publications');
    } catch (error) {
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
                Para añadir detalles, primero selecciona una categoría principal.
            </div>
        );
    }
    const SpecializedComponent = categoryComponentMap[category] || SpecializedFields.GeneralProviderFields;
    return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };

  if (!currentUser || formData === null) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    );
  }

  return (
     <>
      <EditDetailsHeader onSave={handleSaveChanges} isSaving={isSaving}/>
      <main className="container max-w-4xl mx-auto py-8">
         <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['specialized-fields', 'schedule', 'payment-details']} className="w-full space-y-4">
              
              <AccordionItem value="specialized-fields" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Wrench className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Campos Especializados</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="pt-4 border-t">
                          {renderSpecializedFields()}
                      </div>
                  </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="schedule" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Horarios de Atención</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="space-y-4 pt-4 border-t">
                          {daysOfWeek.map(day => {
                              const daySchedule = formData?.schedule?.[day] || { from: '09:00', to: '17:00', active: false };
                              const isActive = daySchedule.active;
                              const fromHour = parseInt(daySchedule.from.split(':')[0], 10);
                              const toHour = parseInt(daySchedule.to.split(':')[0], 10);

                              return (
                                  <div key={day} className="space-y-3">
                                      <div className="flex items-center justify-between">
                                          <Label htmlFor={`switch-${day}`} className="font-medium">{day}</Label>
                                           <Switch 
                                              id={`switch-${day}`} 
                                              checked={isActive} 
                                              onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)}
                                          />
                                      </div>
                                      {isActive && (
                                          <div className="pl-4 space-y-2">
                                              <Slider
                                                  defaultValue={[fromHour, toHour]}
                                                  min={0}
                                                  max={24}
                                                  step={1}
                                                  onValueChange={(value) => handleScheduleChange(day, 'hours', value)}
                                              />
                                              <p className="text-right text-xs font-mono text-muted-foreground">
                                                {`${String(fromHour).padStart(2, '0')}:00 - ${String(toHour).padStart(2, '0')}:00`}
                                              </p>
                                          </div>
                                      )}
                                      <Separator className="pt-2"/>
                                  </div>
                              )
                          })}
                      </div>
                  </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-details" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Configuración Adicional</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="space-y-4 pt-4 border-t">
                          <div className="space-y-2">
                              <Label htmlFor="appointmentCost">Costo de Consulta / Presupuesto (USD)</Label>
                              <Input id="appointmentCost" type="number" placeholder="Ej: 20" value={formData.appointmentCost || ''} onChange={(e) => handleInputChange('appointmentCost', e.target.value ? parseFloat(e.target.value) : undefined)}/>
                              <p className="text-xs text-muted-foreground">Déjalo en blanco si no aplica o es gratuito.</p>
                          </div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>¡Asegúrate de guardar!</AlertTitle>
                  <AlertDescription>
                   Cualquier cambio que realices en estos formularios no se aplicará hasta que hagas clic en el botón de guardar en la parte superior derecha.
                  </AlertDescription>
              </Alert>
          </div>
      </main>
    </>
  );
}
