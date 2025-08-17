
'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Utensils, FileText } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

export const FoodAndRestaurantFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {

    const handleServiceOptionChange = (option: 'local' | 'pickup' | 'delivery' | 'catering', checked: boolean) => {
        onSpecializedChange('serviceOptions', {
            ...formData.specializedData?.serviceOptions,
            [option]: checked
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cuisineType" className="flex items-center gap-2"><Utensils className="w-4 h-4"/> Tipo de Cocina</Label>
                <Input
                    id="cuisineType"
                    placeholder="Ej: Venezolana, Italiana, Postres"
                    value={formData.specializedData?.cuisineType || ''}
                    onChange={(e) => onSpecializedChange('cuisineType', e.target.value)}
                />
            </div>
            <div className="space-y-3">
                <Label>Opciones de Servicio</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2"><Checkbox id="local" checked={formData.specializedData?.serviceOptions?.local} onCheckedChange={(c) => handleServiceOptionChange('local', !!c)} /><Label htmlFor="local">Consumo en Local</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="pickup" checked={formData.specializedData?.serviceOptions?.pickup} onCheckedChange={(c) => handleServiceOptionChange('pickup', !!c)} /><Label htmlFor="pickup">Para Recoger (Pick-up)</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="delivery" checked={formData.specializedData?.serviceOptions?.delivery} onCheckedChange={(c) => handleServiceOptionChange('delivery', !!c)} /><Label htmlFor="delivery">Delivery Propio</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="catering" checked={formData.specializedData?.serviceOptions?.catering} onCheckedChange={(c) => handleServiceOptionChange('catering', !!c)} /><Label htmlFor="catering">Servicio de Catering</Label></div>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="menuUrl" className="flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Enlace al Menú (Opcional)</Label>
                <Input
                    id="menuUrl"
                    placeholder="https://tu-menu.com"
                    value={formData.specializedData?.menuUrl || ''}
                    onChange={(e) => onSpecializedChange('menuUrl', e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="sanitaryPermitId" className="flex items-center gap-2"><FileText className="w-4 h-4"/> Nro. Permiso Sanitario / Manipulación de Alimentos</Label>
                <Input
                    id="sanitaryPermitId"
                    placeholder="ID del permiso requerido en tu país"
                    value={formData.specializedData?.sanitaryPermitId || ''}
                    onChange={(e) => onSpecializedChange('sanitaryPermitId', e.target.value)}
                />
            </div>
        </div>
    );
};
