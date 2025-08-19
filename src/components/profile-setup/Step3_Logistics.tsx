
'use client';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Truck, Star } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useCorabo } from "@/contexts/CoraboContext";

interface Step3_LogisticsProps {
  formData: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step3_Logistics({ formData, onUpdate, onNext }: Step3_LogisticsProps) {
  const router = useRouter();
  const { currentUser } = useCorabo();

  const handleSetLocationFromMap = () => {
    router.push('/map?fromMap=true'); 
  };
  
  const canContinue = formData.offerType && (formData.hasPhysicalLocation ? formData.location : true);

  const handleDeliveryToggle = (checked: boolean) => {
    onUpdate({ isOnlyDelivery: checked });
    // Set default radius only if it's being turned on and wasn't set before
    if (checked && !formData.serviceRadius) {
        onUpdate({ serviceRadius: 10 });
    }
  }

  const showSubscriptionIncentive = (formData.serviceRadius || 0) > 10 && !currentUser?.isSubscribed;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 2: Logística y Operaciones</h2>
      
      <div className="space-y-2">
        <Label>¿Qué ofreces principalmente?</Label>
        <div className="flex gap-4">
           <div className="flex items-center space-x-2">
             <Checkbox id="offer_product" checked={formData.offerType === 'product' || formData.offerType === 'both'} onCheckedChange={(checked) => onUpdate({ offerType: checked ? (formData.offerType === 'service' ? 'both' : 'product') : (formData.offerType === 'both' ? 'service' : undefined) })} />
             <Label htmlFor="offer_product" className="font-normal">Productos</Label>
           </div>
           <div className="flex items-center space-x-2">
             <Checkbox id="offer_service" checked={formData.offerType === 'service' || formData.offerType === 'both'} onCheckedChange={(checked) => onUpdate({ offerType: checked ? (formData.offerType === 'product' ? 'both' : 'service') : (formData.offerType === 'both' ? 'product' : undefined) })} />
             <Label htmlFor="offer_service" className="font-normal">Servicios</Label>
           </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="has_physical_location" checked={formData.hasPhysicalLocation} onCheckedChange={(checked) => onUpdate({ hasPhysicalLocation: !!checked })} />
          <Label htmlFor="has_physical_location">Tengo una tienda o local físico</Label>
        </div>

        {formData.hasPhysicalLocation && (
          <div className="space-y-4 pl-6 border-l-2 ml-3">
             <div className="space-y-2">
                <Label htmlFor="location">Ubicación del Negocio</Label>
                <div className="flex items-center gap-2">
                   <Input id="location" value={formData.location || ''} placeholder="Establece tu ubicación en el mapa" readOnly />
                   <Button variant="outline" size="icon" onClick={handleSetLocationFromMap}><MapPin className="w-4 h-4"/></Button>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="show_exact" className="text-sm">Mostrar ubicación exacta a clientes</Label>
                <Switch id="show_exact" checked={formData.showExactLocation} onCheckedChange={(checked) => onUpdate({ showExactLocation: checked })} />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
              <Label htmlFor="has_delivery" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Ofrecemos Delivery / Servicio a Domicilio</Label>
              <Switch id="has_delivery" checked={formData.isOnlyDelivery} onCheckedChange={handleDeliveryToggle} />
          </div>
          {formData.isOnlyDelivery && (
             <div className="space-y-2 pl-6 border-l-2 ml-3">
                <Label htmlFor="radius">Radio de cobertura (en kilómetros)</Label>
                <Input id="radius" type="number" value={formData.serviceRadius || ''} onChange={(e) => onUpdate({ serviceRadius: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">La distancia en la que se mostrarán tus servicios.</p>
                {showSubscriptionIncentive && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3"/> Para un radio mayor a 10km, suscríbete y obtén alcance ilimitado.
                  </p>
                )}
             </div>
          )}
      </div>
      
      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Siguiente
      </Button>
    </div>
  );
}
