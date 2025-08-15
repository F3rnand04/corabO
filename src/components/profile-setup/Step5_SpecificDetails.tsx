
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { MapPin, Building, AlertCircle, Package, Hand, Star, Info, LocateFixed } from 'lucide-react';
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
import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { requestAffiliation } from "@/ai/flows/affiliation-flow";

interface Step5_SpecificDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Step5_SpecificDetails({ onBack, onNext, formData, setFormData }: Step5_SpecificDetailsProps) {
  const router = useRouter();
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const { currentUser, users } = useCorabo();
  
  const MAX_RADIUS_FREE = 10;
  const isOverFreeRadius = (formData.serviceRadius || 0) > MAX_RADIUS_FREE && !(currentUser?.isSubscribed);

  const handleFormDataChange = (field: keyof ProfileSetupData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const handleMapClick = () => {
    router.push('/map');
  };

  const handleScheduleChange = (day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    // **FIX**: Defensive check to prevent crash on undefined schedule object.
    if (!formData.schedule) {
        // If schedule doesn't exist, initialize it before updating
        const initialSchedule = daysOfWeek.reduce((acc, d) => {
            acc[d] = { from: '09:00', to: '17:00', active: d !== 'Sábado' && d !== 'Domingo' };
            return acc;
        }, {} as ProfileSetupData['schedule']);
        setFormData({
            ...formData,
            schedule: {
                ...initialSchedule,
                [day]: { ...(initialSchedule?.[day] || {}), [field]: value }
            }
        });
        return;
    }

    const newSchedule = { ...(formData.schedule), [day]: { ...(formData.schedule[day] || {}), [field]: value } };
    handleFormDataChange('schedule', newSchedule);
  };
  
  return (
    <>
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Paso 5: Detalles Específicos del Proveedor</h2>
      
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad / Descripción corta</Label>
        <Textarea 
            id="specialty" 
            placeholder="Ej: Expertos en cocina italiana." 
            rows={2} 
            maxLength={30}
            value={formData.specialty || ''}
            onChange={(e) => handleFormDataChange('specialty', e.target.value)}
        />
        <p className="text-xs text-muted-foreground text-right">{formData.specialty?.length || 0} / 30</p>
      </div>

       <div className="space-y-3">
        <Label>Ofrezco principalmente</Label>
        <RadioGroup value={formData.offerType || 'service'} onValueChange={(value: 'product' | 'service') => handleFormDataChange('offerType', value)} className="flex gap-4">
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="service" id="service" />
                <Label htmlFor="service" className="flex items-center gap-2 font-normal cursor-pointer"><Hand className="w-4 h-4"/> Servicios</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="product" id="product" />
                <Label htmlFor="product" className="flex items-center gap-2 font-normal cursor-pointer"><Package className="w-4 h-4"/> Productos</Label>
            </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>Afiliación Profesional</Label>
        <div className="p-4 rounded-md border">
          <p className="text-sm text-muted-foreground mb-2">Solicita la verificación de la empresa donde trabajas para aumentar tu confianza.</p>
          <Button variant="outline" onClick={() => console.log('Open company search modal')}>
            Buscar y Solicitar Afiliación
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
          <Label>Opciones de Pago y Citas</Label>
           <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <Link href="/credicora" className="cursor-pointer group">
                  <Label htmlFor="accepts-credicora" className="flex items-center gap-2 font-medium text-blue-600 group-hover:underline">
                      <Star className="w-5 h-5 fill-current"/>
                      Aceptar Pagos con Credicora
                  </Label>
                </Link>
                <Switch 
                    id="accepts-credicora" 
                    checked={formData.acceptsCredicora}
                    onCheckedChange={(checked) => handleFormDataChange('acceptsCredicora', checked)}
                />
            </div>

            {formData.acceptsCredicora && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 !text-current" />
                    <AlertTitle className="font-bold">¡Amplía tu Horizonte de Clientes con CrediCora!</AlertTitle>
                    <AlertDescription>
                        Al aceptar pagos con CrediCora, no solo aseguras recibir tu dinero de forma segura, sino que abres las puertas a un universo de clientes que valoran la flexibilidad. Tus ingresos se multiplicarán.
                    </AlertDescription>
                </Alert>
            )}

            {formData.offerType === 'service' && (
              <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="appointment-cost">
                      Costo por Consulta/Cita
                      <span className="block text-xs text-muted-foreground">Dejar en 0 si es gratis o variable.</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                        id="appointment-cost"
                        type="number"
                        className="w-28 pl-6"
                        value={formData.appointmentCost || 0}
                        onChange={(e) => handleFormDataChange('appointmentCost', parseFloat(e.target.value))}
                    />
                  </div>
              </div>
            )}
          </div>
      </div>


      <div className="space-y-4">
        <Label>Ubicación y Área de Cobertura</Label>
        <div className="space-y-4 rounded-md border p-4">
           <div className="flex items-center justify-between">
             <Label htmlFor="has-physical-location" className="flex items-center gap-2 font-medium">
                <Building className="w-5 h-5"/>
                Tengo un local físico
             </Label>
             <Switch 
                id="has-physical-location" 
                checked={formData.hasPhysicalLocation}
                onCheckedChange={(checked) => handleFormDataChange('hasPhysicalLocation', checked)}
            />
           </div>

            <div className="relative">
                 <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleMapClick}>
                    <LocateFixed className="h-5 w-5" />
                 </Button>
                <Input 
                  id="location" 
                  placeholder="Ubicación de tu negocio..." 
                  className="pl-12"
                  value={formData.location || ''}
                  onChange={(e) => handleFormDataChange('location', e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between">
                 <Label htmlFor="show-exact-location" className="flex items-center gap-2 font-medium">
                    Mostrar ubicación exacta
                 </Label>
                 <Switch 
                    id="show-exact-location" 
                    checked={formData.showExactLocation}
                    onCheckedChange={(checked) => handleFormDataChange('showExactLocation', checked)}
                />
            </div>
            
            {!formData.showExactLocation && (
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="service-radius">Radio de acción</Label>
                        <Badge variant={isOverFreeRadius ? "destructive" : "secondary"} className="font-mono">{formData.serviceRadius} km</Badge>
                    </div>
                    <Slider
                        id="service-radius"
                        min={5}
                        max={100}
                        step={5}
                        value={[formData.serviceRadius || 5]}
                        onValueChange={(value) => handleFormDataChange('serviceRadius', value[0])}
                        className={cn(isOverFreeRadius && '[&_.bg-primary]:bg-destructive')}
                    />
                     {isOverFreeRadius ? (
                         <div className="flex items-center justify-center gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span className="flex-grow">¡Activa un plan para ampliar tu alcance y obtener la insignia de verificado!</span>
                            <Button size="sm" className="h-7 text-xs" variant="destructive" onClick={() => setIsSubscriptionDialogOpen(true)}>Suscribir</Button>
                         </div>
                     ) : (
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="only-delivery" className="flex items-center gap-2">
                                Mi servicio es solo delivery
                            </Label>
                            <Switch 
                                id="only-delivery"
                                checked={formData.isOnlyDelivery}
                                onCheckedChange={(checked) => handleFormDataChange('isOnlyDelivery', checked)}
                            />
                        </div>
                     )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Horarios de Atención</Label>
        <div className="space-y-3 rounded-md border p-4">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Redes Sociales / Sitio Web (Opcional)</Label>
        <Input id="website" placeholder="https://tu-sitio-web.com" value={formData.website || ''} onChange={(e) => handleFormDataChange('website', e.target.value)} />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={!formData.location?.trim()}>Siguiente</Button>
      </div>
    </div>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}

    