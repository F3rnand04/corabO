
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BedDouble, Earth, Sparkles, Compass, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

const lodgingTypes = ['Hotel', 'Apartamento', 'Casa', 'Cabaña', 'Habitación'];
const tourTypes = ['Aventura', 'Cultural', 'Gastronómico', 'Playa', 'Montaña'];
const amenitiesOptions = ['WiFi', 'Piscina', 'Cocina', 'AC', 'TV', 'Estacionamiento'];
const includedServicesOptions = ['Transporte', 'Alojamiento', 'Comidas', 'Guía Bilingüe', 'Entradas a Parques'];

export const TourismAndLodgingFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const providerType = formData.providerType;

    const handleAmenityChange = (amenity: string) => {
        const currentAmenities = formData.specializedData?.amenities || [];
        const newAmenities = currentAmenities.includes(amenity)
            ? currentAmenities.filter(a => a !== amenity)
            : [...currentAmenities, amenity];
        onSpecializedChange('amenities', newAmenities);
    };
    
    const handleIncludedServiceChange = (service: string) => {
        const currentServices = formData.specializedData?.includedServices || [];
        const newServices = currentServices.includes(service)
            ? currentServices.filter(s => s !== service)
            : [...currentServices, service];
        onSpecializedChange('includedServices', newServices);
    };

    return (
        <div className="space-y-4">
            {providerType === 'lodging' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="lodgingType" className="flex items-center gap-2"><BedDouble className="w-4 h-4"/> Tipo de Hospedaje</Label>
                        <Select value={formData.specializedData?.lodgingType || ''} onValueChange={(value) => onSpecializedChange('lodgingType', value)}>
                            <SelectTrigger id="lodgingType"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                            <SelectContent>
                                {lodgingTypes.map(type => <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="capacity">Capacidad de Huéspedes</Label>
                        <Input id="capacity" type="number" placeholder="Ej: 4" value={formData.specializedData?.capacity || ''} onChange={(e) => onSpecializedChange('capacity', parseInt(e.target.value, 10) || undefined)}/>
                    </div>
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> Comodidades</Label>
                         <div className="grid grid-cols-2 gap-2">
                             {amenitiesOptions.map(amenity => (
                                <div key={amenity} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`amenity-${amenity}`}
                                        checked={(formData.specializedData?.amenities || []).includes(amenity)}
                                        onCheckedChange={() => handleAmenityChange(amenity)}
                                    />
                                    <Label htmlFor={`amenity-${amenity}`} className="font-normal">{amenity}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {providerType === 'tourism' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="tourType" className="flex items-center gap-2"><Earth className="w-4 h-4"/> Tipo de Tour</Label>
                        <Select value={formData.specializedData?.tourType || ''} onValueChange={(value) => onSpecializedChange('tourType', value)}>
                            <SelectTrigger id="tourType"><SelectValue placeholder="Selecciona un tipo de tour" /></SelectTrigger>
                            <SelectContent>
                                {tourTypes.map(type => <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duración del Tour</Label>
                        <Input id="duration" placeholder="Ej: Día completo, 3 horas, 2 días y 1 noche" value={formData.specializedData?.duration || ''} onChange={(e) => onSpecializedChange('duration', e.target.value)}/>
                    </div>
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2"><Compass className="w-4 h-4"/> Servicios Incluidos</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {includedServicesOptions.map(service => (
                                <div key={service} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`service-${service}`}
                                        checked={(formData.specializedData?.includedServices || []).includes(service)}
                                        onCheckedChange={() => handleIncludedServiceChange(service)}
                                    />
                                    <Label htmlFor={`service-${service}`} className="font-normal">{service}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
