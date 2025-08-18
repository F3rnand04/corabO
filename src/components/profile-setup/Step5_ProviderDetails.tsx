'use client';

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Settings, Wrench, Clock, Save, Loader2, DollarSign, Checkbox } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Import all specialized fields from the new index file
import * as SpecializedFields from '@/components/profile/specialized-fields';

import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

// Component map using the imported object
const categoryComponentMap: { [key: string]: React.ElementType } = {
    'Transporte y Asistencia': SpecializedFields.TransportFields,
    'Salud y Bienestar': SpecializedFields.HealthFields,
    'Hogar y Reparaciones': SpecializedFields.HomeRepairFields,
    'Alimentos y Restaurantes': SpecializedFields.FoodAndRestaurantFields,
    'Belleza': SpecializedFields.BeautyFields,
    'Automotriz y Repuestos': SpecializedFields.AutomotiveFields,
    'Tecnología y Soporte': SpecializedFields.GeneralProviderFields,
    'Educación': SpecializedFields.GeneralProviderFields,
    'Eventos': SpecializedFields.GeneralProviderFields,
};

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface Step5_ProviderDetailsProps {
  onBack?: () => void;
  onNext?: () => void;
  initialFormData: ProfileSetupData;
  isEditMode?: boolean;
  onSave: (formData: ProfileSetupData) => Promise<void>;
}

export default function Step5_ProviderDetails({ onBack, onNext, initialFormData, isEditMode = false, onSave }: Step5_ProviderDetailsProps) {
  const { toast } = useToast();
  // The component's state is now exclusively managed through props and its own state.
  const [formData, setFormData] = useState<ProfileSetupData>(initialFormData || {});
  const [isSaving, setIsSaving] = useState(false);

  // When the initial form data from props changes, update the component's state.
  useEffect(() => {
    setFormData(initialFormData || {});
  }, [initialFormData]);
  
  const handleInputChange = (field: keyof ProfileSetupData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      setFormData(prev => ({
          ...prev,
          specializedData: {
              ...(prev.specializedData || {}),
              [field]: value
          }
      }));
  }, []);
  
  const handleScheduleChange = useCallback((day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    const currentSchedule = formData.schedule || {};
    const newSchedule = { ...currentSchedule, [day]: { ...(currentSchedule[day] || {}), [field]: value } };
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  }, [formData.schedule]);


  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        await onSave(formData);
        if (isEditMode) {
            toast({ title: "Perfil Actualizado", description: "Tus detalles han sido guardados." });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleNextWithSave = async () => {
    await onSave(formData);
    if(onNext) onNext();
  }

  const renderSpecializedFields = () => {
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

  return (
    <div className="space-y-6">
      {!isEditMode && (
        <>
            <h2 className="text-xl font-semibold">Paso 5: Detalles del Proveedor</h2>
            <p className="text-sm text-muted-foreground">
                Completa tu perfil para que los clientes puedan encontrarte y entender mejor lo que ofreces.
            </p>
        </>
      )}

      <Accordion type="multiple" defaultValue={['general-details', 'specialized-fields', 'schedule', 'payment-details']} className="w-full space-y-4">
        
        <AccordionItem value="general-details" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary"/>
                    <span className="font-semibold">Detalles Generales</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
                 <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad / Descripción corta (máx. 30 caracteres)</Label>
                        <Textarea id="specialty" placeholder="Ej: Expertos en cocina italiana." rows={2} maxLength={30} value={formData.specialty || ''} onChange={(e) => handleInputChange('specialty', e.target.value)}/>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>

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
                <div className="space-y-3 pt-4 border-t">
                    {daysOfWeek.map(day => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <Label htmlFor={`switch-${day}`} className="w-24">{day}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input type="time" value={formData?.schedule?.[day]?.from || '09:00'} onChange={(e) => handleScheduleChange(day, 'from', e.target.value)} className="w-full sm:w-auto"/>
                                <span>-</span>
                                <Input type="time" value={formData?.schedule?.[day]?.to || '17:00'} onChange={(e) => handleScheduleChange(day, 'to', e.target.value)} className="w-full sm:w-auto"/>
                            </div>
                        </div>
                    ))}
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
                     <div className="flex items-center space-x-2">
                        <Checkbox id="accepts-credicora" checked={formData.acceptsCredicora} onCheckedChange={(checked) => handleInputChange('acceptsCredicora', !!checked)} />
                        <Label htmlFor="accepts-credicora" className="font-medium">Acepto Credicora en mis ventas</Label>
                    </div>
                </div>
             </AccordionContent>
        </AccordionItem>

      </Accordion>

        {isEditMode ? (
             <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full" size="lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                Guardar Cambios
             </Button>
        ) : (
            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>Atrás</Button>
                <Button onClick={handleNextWithSave}>Siguiente</Button>
            </div>
        )}
    </div>
  );
}
