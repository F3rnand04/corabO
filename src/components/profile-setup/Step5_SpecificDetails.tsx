
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { MapPin, Building, AlertCircle } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionDialog } from '../SubscriptionDialog';

interface Step5_SpecificDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: any;
  setFormData: (data: any) => void;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Step5_SpecificDetails({ onBack, onNext, formData, setFormData }: Step5_SpecificDetailsProps) {
  const [specialty, setSpecialty] = useState(formData.specialty);
  const [location, setLocation] = useState(formData.location);
  const [serviceRadius, setServiceRadius] = useState(formData.serviceRadius);
  const [hasPhysicalLocation, setHasPhysicalLocation] = useState(formData.hasPhysicalLocation);
  const [showExactLocation, setShowExactLocation] = useState(formData.showExactLocation);
  const [isOnlyDelivery, setIsOnlyDelivery] = useState(formData.isOnlyDelivery);
  const [website, setWebsite] = useState(formData.website);
  const [schedule, setSchedule] = useState(formData.schedule);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  useEffect(() => {
    setFormData({ 
      ...formData, 
      specialty,
      location,
      serviceRadius,
      hasPhysicalLocation,
      showExactLocation,
      isOnlyDelivery,
      website,
      schedule
    });
  }, [specialty, location, serviceRadius, hasPhysicalLocation, showExactLocation, isOnlyDelivery, website, schedule, setFormData]);

  const MAX_RADIUS_FREE = 10;
  const isOverFreeRadius = serviceRadius > MAX_RADIUS_FREE;
  
  const handleGpsClick = () => {
    setLocation('https://maps.app.goo.gl/h2bYMPEgneUp9i7J8');
  };

  const handleScheduleChange = (day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  return (
    <>
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Paso 5: Detalles Específicos del Proveedor</h2>
      
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad / Descripción corta</Label>
        <Textarea 
            id="specialty" 
            placeholder="Ej: Expertos en cocina italiana tradicional." 
            rows={3} 
            maxLength={150}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
        />
        <p className="text-xs text-muted-foreground text-right">{specialty.length} / 150</p>
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
                checked={hasPhysicalLocation}
                onCheckedChange={setHasPhysicalLocation}
            />
           </div>

            <div className="relative">
                <MapPin 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={handleGpsClick}
                />
                <Input 
                  id="location" 
                  placeholder="Ingresa la dirección de tu negocio (Obligatorio)" 
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between">
                 <Label htmlFor="show-exact-location" className="flex items-center gap-2 font-medium">
                    Mostrar ubicación exacta
                 </Label>
                 <Switch 
                    id="show-exact-location" 
                    checked={showExactLocation}
                    onCheckedChange={setShowExactLocation}
                />
            </div>
            
            {!showExactLocation && (
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="service-radius">Radio de acción</Label>
                        <Badge variant={isOverFreeRadius ? "destructive" : "secondary"} className="font-mono">{serviceRadius} km</Badge>
                    </div>
                    <Slider
                        id="service-radius"
                        min={5}
                        max={100}
                        step={5}
                        value={[serviceRadius]}
                        onValueChange={(value) => setServiceRadius(value[0])}
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
                                checked={isOnlyDelivery}
                                onCheckedChange={setIsOnlyDelivery}
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
                        <Switch id={`switch-${day}`} checked={schedule[day]?.active} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} />
                        <Label htmlFor={`switch-${day}`} className="w-24">{day}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input type="time" value={schedule[day]?.from} onChange={(e) => handleScheduleChange(day, 'from', e.target.value)} className="w-full sm:w-auto"/>
                        <span>-</span>
                        <Input type="time" value={schedule[day]?.to} onChange={(e) => handleScheduleChange(day, 'to', e.target.value)} className="w-full sm:w-auto"/>
                    </div>
                 </div>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Redes Sociales / Sitio Web (Opcional)</Label>
        <Input id="website" placeholder="https://tu-sitio-web.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={!location.trim()}>Siguiente</Button>
      </div>
    </div>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
