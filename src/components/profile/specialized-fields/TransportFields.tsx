
'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Package, Truck, Wrench } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

export const TransportFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="vehicleType" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Tipo de Vehículo</Label>
            <Input id="vehicleType" placeholder="Ej: Camión 350, Grúa de Plataforma" value={formData.specializedData?.vehicleType || ''} onChange={(e) => onSpecializedChange('vehicleType', e.target.value)}/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2"><Package className="w-4 h-4"/> Capacidad de Carga</Label>
            <Input id="capacity" placeholder="Ej: 3,500 Kg, 2 vehículos" value={formData.specializedData?.capacity || ''} onChange={(e) => onSpecializedChange('capacity', e.target.value)}/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="specialConditions" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Equipos o Condiciones Especiales</Label>
            <Textarea id="specialConditions" placeholder="Ej: Rampa hidráulica, GPS, Cava refrigerada..." value={formData.specializedData?.specialConditions || ''} onChange={(e) => onSpecializedChange('specialConditions', e.target.value)} rows={3}/>
        </div>
    </div>
);
