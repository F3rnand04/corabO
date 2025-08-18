
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { MapPin, Building, AlertCircle, Package, Hand, Star, Info, LocateFixed, Handshake, Wrench, Stethoscope, BadgeCheck, Truck, Utensils, Link as LinkIcon, Briefcase, BrainCircuit, Scissors, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionDialog } from '../SubscriptionDialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import { useState, useCallback } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

// --- Specialized Field Components ---
import { HealthFields } from '../profile/specialized-fields/HealthFields';
import { TransportFields } from '../profile/specialized-fields/TransportFields';
import { GeneralProviderFields } from '../profile/specialized-fields/GeneralProviderFields';
import { HomeRepairFields } from '../profile/specialized-fields/HomeRepairFields';
import { FoodAndRestaurantFields } from '../profile/specialized-fields/FoodAndRestaurantFields';
import { BeautyFields } from '../profile/specialized-fields/BeautyFields';
import { AutomotiveFields } from '../profile/specialized-fields/AutomotiveFields';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

interface Step5_ProviderDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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

export default function Step5_ProviderDetails({ onBack, onNext, formData, setFormData }: Step5_ProviderDetailsProps) {
  const router = useRouter();
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const { currentUser, users, requestAffiliation } = useCorabo();
  const { toast } = useToast();
  
  const MAX_RADIUS_FREE = 10;
  const isOverFreeRadius = (formData.serviceRadius || 0) > MAX_RADIUS_FREE && !(currentUser?.isSubscribed);
  const isProfessional = formData.providerType === 'professional';

  const companies = users.filter(u => u.profileSetupData?.providerType === 'company');

  const handleFormDataChange = useCallback((field: keyof ProfileSetupData, value: any) => {
    setFormData({ ...formData, [field]: value });
  }, [formData, setFormData]);

  const handleScheduleChange = useCallback((day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    const currentSchedule = formData.schedule || {};
    const newSchedule = { ...currentSchedule, [day]: { ...(currentSchedule?.[day] || {}), [field]: value } };
    handleFormDataChange('schedule', newSchedule);
  }, [formData, handleFormDataChange]);
  
  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      setFormData(prev => ({
          ...prev,
          specializedData: {
              ...(prev.specializedData || {}),
              [field]: value
          }
      }));
  }, [setFormData]);

  const handleRequestAffiliation = async (companyId: string) => {
      if (!currentUser || !companyId) return;
      try {
          await requestAffiliation(currentUser.id, companyId);
          toast({
              title: "Solicitud Enviada",
              description: "Tu solicitud de afiliación ha sido enviada a la empresa."
          })
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Error al solicitar",
              description: error.message || "No se pudo enviar la solicitud."
          })
      }
  };

  const handleMapClick = () => {
    if (formData.location) {
        const [lat, lon] = formData.location.split(',').map(Number);
        if(!isNaN(lat) && !isNaN(lon)) {
             const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
             window.open(mapsUrl, '_blank');
        }
    } else {
        toast({
            title: "Ubicación no definida",
            description: "Por favor, ingresa una ubicación en el campo de texto primero."
        });
    }
  };
  
  const renderSpecializedFields = () => {
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Selecciona una categoría principal para ver los campos especializados.
            </div>
        );
    }
    
    const SpecializedComponent = categoryComponentMap[category];
    
    if (SpecializedComponent) {
        return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
    }

    // Fallback for categories without a specific component yet or general ones
    return <GeneralProviderFields formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };

  
  return (
    <>
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 5: Detalles del Proveedor</h2>
        <p className="text-sm text-muted-foreground">
            Completa tu perfil para que los clientes puedan encontrarte y entender mejor lo que ofreces.
        </p>

      <Accordion type="multiple" defaultValue={['general', 'location', 'schedule', 'specialized']} className="w-full space-y-4">
        
        <AccordionItem value="general" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                 <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-primary"/> <span className="font-semibold">Información General</span></div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 border-t mt-4">
                <div className="space-y-4 pt-4">
                     <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad / Descripción corta (máx. 30 caracteres)</Label>
                        <Textarea id="specialty" placeholder="Ej: Expertos en cocina italiana." rows={2} maxLength={30} value={formData.specialty || ''} onChange={(e) => handleFormDataChange('specialty', e.target.value)}/>
                        <p className="text-xs text-muted-foreground text-right">{formData.specialty?.length || 0} / 30</p>
                    </div>
                     <div className="space-y-3 pt-2">
                        <Label>Ofrezco principalmente</Label>
                        <RadioGroup value={formData.offerType || 'service'} onValueChange={(value: 'product' | 'service') => handleFormDataChange('offerType', value)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="service" id="service" /><Label htmlFor="service" className="flex items-center gap-2 font-normal cursor-pointer"><Hand className="w-4 h-4"/> Servicios</Label></div>
                             <div className="flex items-center space-x-2"><RadioGroupItem value="product" id="product" /><Label htmlFor="product" className="flex items-center gap-2 font-normal cursor-pointer"><Package className="w-4 h-4"/> Productos</Label></div>
                        </RadioGroup>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="specialized" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                 <div className="flex items-center gap-3"><BadgeCheck className="w-5 h-5 text-primary"/> <span className="font-semibold">Campos Especializados</span></div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 border-t mt-4">
                 <div className="pt-4">{renderSpecializedFields()}</div>
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="location" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                 <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-primary"/> <span className="font-semibold">Ubicación y Cobertura</span></div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 border-t mt-4">
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleMapClick}><LocateFixed className="h-5 w-5" /></Button>
                        <Input id="location" placeholder="Ubicación de tu negocio..." className="pl-12" value={formData.location || ''} onChange={(e) => handleFormDataChange('location', e.target.value)}/>
                    </div>
                    <div className="flex items-center justify-between">
                         <Label htmlFor="show-exact-location" className="flex items-center gap-2 font-medium">Mostrar ubicación exacta</Label>
                         <Switch id="show-exact-location" checked={formData.showExactLocation} onCheckedChange={(checked) => handleFormDataChange('showExactLocation', checked)}/>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="schedule" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                 <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-primary"/> <span className="font-semibold">Horarios de Atención</span></div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 border-t mt-4">
                 <div className="space-y-3 pt-4">
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
      </Accordion>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={!formData.location?.trim()}>Siguiente</Button>
      </div>
    </div>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}

    