
'use client';

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Settings, Wrench, Clock, Save, Loader2 } from 'lucide-react';
import type { ProfileSetupData, User as UserType } from '@/lib/types';
import { useState, useCallback, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';

// Specialized Field Components
import { HealthFields } from '@/components/profile/specialized-fields/HealthFields';
import { TransportFields } from '@/components/profile/specialized-fields/TransportFields';
import { GeneralProviderFields } from '@/components/profile/specialized-fields/GeneralProviderFields';
import { HomeRepairFields } from '@/components/profile/specialized-fields/HomeRepairFields';
import { FoodAndRestaurantFields } from '@/components/profile/specialized-fields/FoodAndRestaurantFields';
import { BeautyFields } from '@/components/profile/specialized-fields/BeautyFields';
import { AutomotiveFields } from '@/components/profile/specialized-fields/AutomotiveFields';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

// Component map for specialized fields
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

interface Step5_ProviderDetailsProps {
  onBack?: () => void;
  onNext?: () => void;
  initialFormData: ProfileSetupData;
  profileType: UserType['type'];
  isEditMode?: boolean; // New prop to indicate edit mode
  onSave?: (formData: ProfileSetupData) => Promise<void>;
}

export default function Step5_ProviderDetails({ onBack, onNext, initialFormData, isEditMode = false, onSave }: Step5_ProviderDetailsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileSetupData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

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
  }, [formData]);


  const handleSaveChanges = async () => {
    if (onSave) {
        setIsSaving(true);
        try {
            await onSave(formData);
            toast({ title: "Cambios Guardados", description: "Tu perfil ha sido actualizado." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
        } finally {
            setIsSaving(false);
        }
    }
  };

  const renderSpecializedFields = () => {
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Para añadir detalles, primero selecciona una categoría principal.
            </div>
        );
    }
    const SpecializedComponent = categoryComponentMap[category] || GeneralProviderFields;
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

      <Accordion type="multiple" defaultValue={['general-details', 'specialized-fields', 'schedule']} className="w-full space-y-4">
        
        {/* General Details - Only for setup */}
        {!isEditMode && (
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
                        <Textarea id="specialty" placeholder="Ej: Expertos en cocina italiana." rows={2} maxLength={30} value={formData.specialty || ''} onChange={(e) => setFormData({...formData, specialty: e.target.value})}/>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
        )}

        {/* Specialized Fields */}
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
        
         {/* Schedule */}
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
                                <Switch id={`switch-${day}`} checked={formData?.schedule?.[day]?.active ?? false} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} />
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

      </Accordion>

        {isEditMode ? (
             <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full" size="lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                Guardar Cambios
             </Button>
        ) : (
            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>Atrás</Button>
                <Button onClick={onNext}>Siguiente</Button>
            </div>
        )}
    </div>
  );
}
