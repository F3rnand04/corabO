

'use client';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Truck, Star } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useCorabo } from "@/contexts/CoraboContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import SetLocationButton from "./SetLocationButton";
import { SpecializedFields } from "./SpecializedFields";
import { updateUser } from "@/lib/actions/user.actions";

interface Step3_LogisticsProps {
  formData: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

export default function Step3_Logistics({ formData, onUpdate, onNext }: Step3_LogisticsProps) {
  const { currentUser } = useCorabo();
  
  const canContinue = formData.offerType && (formData.hasPhysicalLocation ? formData.location : true);

  const handleDeliveryToggle = (checked: boolean) => {
    onUpdate({ isOnlyDelivery: checked });
    if (checked && !formData.serviceRadius) {
        onUpdate({ serviceRadius: 10 });
    }
  }
  
  const handleUpdateRadius = (radius: number) => {
    if (!currentUser) return;
    updateUser(currentUser.id, { 'profileSetupData.serviceRadius': radius });
  }

  const showSubscriptionIncentive = (formData.serviceRadius || 0) > 10 && !currentUser?.isSubscribed;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 2: Logística y Especialización</h2>
      
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Tipo de Oferta y Ubicación</CardTitle>
                <CardDescription>Define qué ofreces y dónde te encuentras.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <Separator />

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
                                <SetLocationButton />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show_exact" className="text-sm">Mostrar ubicación exacta a clientes</Label>
                            <Switch id="show_exact" checked={formData.showExactLocation} onCheckedChange={(checked) => onUpdate({ showExactLocation: checked })} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Detalles de Servicio</CardTitle>
                <CardDescription>Configura cómo y dónde se verán tus servicios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="has_delivery" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Ofreces Delivery / Servicio a Domicilio</Label>
                    <Switch id="has_delivery" checked={formData.isOnlyDelivery} onCheckedChange={handleDeliveryToggle} />
                </div>
                {formData.isOnlyDelivery && (
                    <div className="space-y-2 pl-6 border-l-2 ml-3">
                        <Label htmlFor="radius">Radio de visibilidad de tus servicios (en kilómetros)</Label>
                        <Input id="radius" type="number" value={formData.serviceRadius || ''} onChange={(e) => onUpdate({ serviceRadius: Number(e.target.value) })} />
                        {showSubscriptionIncentive && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3"/> Para un radio mayor a 10km, suscríbete y obtén alcance ilimitado.
                        </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
        
        <SpecializedFields formData={formData} onUpdate={onUpdate} />

      </div>
      
      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Siguiente
      </Button>
    </div>
  );
}
