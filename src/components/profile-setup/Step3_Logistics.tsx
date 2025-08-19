'use client';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Truck, Star, Wrench } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useCorabo } from "@/contexts/CoraboContext";
import * as SpecializedFields from '@/components/profile/specialized-fields';
import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

interface Step3_LogisticsProps {
  formData: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
}

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

export default function Step3_Logistics({ formData, onUpdate, onNext }: Step3_LogisticsProps) {
  const router = useRouter();
  const { currentUser } = useCorabo();

  const handleSetLocationFromMap = () => {
    router.push('/map?fromMap=true'); 
  };
  
  const canContinue = formData.offerType && (formData.hasPhysicalLocation ? formData.location : true);

  const handleDeliveryToggle = (checked: boolean) => {
    onUpdate({ isOnlyDelivery: checked });
    if (checked && !formData.serviceRadius) {
        onUpdate({ serviceRadius: 10 });
    }
  }

  const showSubscriptionIncentive = (formData.serviceRadius || 0) > 10 && !currentUser?.isSubscribed;

  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      onUpdate({
          specializedData: {
              ...(formData.specializedData || {}),
              [field]: value
          }
      });
  }, [formData.specializedData, onUpdate]);

  const renderSpecializedFields = () => {
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Vuelve al paso anterior para seleccionar una categoría principal.
            </div>
        );
    }
    const SpecializedComponent = categoryComponentMap[category] || SpecializedFields.GeneralProviderFields;
    return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };


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
                                <Button variant="outline" size="icon" onClick={handleSetLocationFromMap}><MapPin className="w-4 h-4"/></Button>
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
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5"/>Detalles Específicos</CardTitle>
                <CardDescription>Completa la información según la categoría de tu negocio.</CardDescription>
            </CardHeader>
            <CardContent>
                 {renderSpecializedFields()}
            </CardContent>
        </Card>

      </div>
      
      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        Siguiente
      </Button>
    </div>
  );
}
