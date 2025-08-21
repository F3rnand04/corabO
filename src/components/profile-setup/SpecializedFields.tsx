
'use client';

import { useCallback } from "react";
import type { ProfileSetupData } from '@/lib/types';
import * as SpecializedFieldsMap from '@/components/profile/specialized-fields';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Wrench } from "lucide-react";

interface SpecializedFieldsProps {
    formData: ProfileSetupData;
    onUpdate: (data: Partial<ProfileSetupData>) => void;
}

const categoryComponentMap: { [key: string]: React.ElementType } = {
    'Transporte y Asistencia': SpecializedFieldsMap.TransportFields,
    'Salud y Bienestar': SpecializedFieldsMap.HealthFields,
    'Hogar y Reparaciones': SpecializedFieldsMap.HomeRepairFields,
    'Alimentos y Restaurantes': SpecializedFieldsMap.FoodAndRestaurantFields,
    'Belleza': SpecializedFieldsMap.BeautyFields,
    'Automotriz y Repuestos': SpecializedFieldsMap.AutomotiveFields,
    'Tecnología y Soporte': SpecializedFieldsMap.GeneralProviderFields,
    'Educación': SpecializedFieldsMap.GeneralProviderFields,
    'Eventos': SpecializedFieldsMap.GeneralProviderFields,
};

export function SpecializedFields({ formData, onUpdate }: SpecializedFieldsProps) {
    
    const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
        onUpdate({
            specializedData: {
                ...(formData.specializedData || {}),
                [field]: value
            }
        });
    }, [formData.specializedData, onUpdate]);

    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Vuelve al paso anterior para seleccionar una categoría principal y ver los campos especializados.
            </div>
        );
    }
    
    const SpecializedComponent = categoryComponentMap[category] || SpecializedFieldsMap.GeneralProviderFields;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5"/>Detalles Específicos</CardTitle>
                <CardDescription>Completa la información según la categoría de tu negocio para enriquecer tu perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                 <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />
            </CardContent>
        </Card>
    );
}
