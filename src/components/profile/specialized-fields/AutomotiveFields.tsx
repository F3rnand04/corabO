'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea';
import { Car, Wrench, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { automotiveServicesOptions } from '@/lib/data/options';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

export const AutomotiveFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentBrand, setCurrentBrand] = useState('');

    const handleServiceChange = (service: string) => {
        const currentServices = formData.specializedData?.mainServices || [];
        const newServices = currentServices.includes(service)
            ? currentServices.filter(s => s !== service)
            : [...currentServices, service];
        onSpecializedChange('mainServices', newServices);
    };

    const handleAddBrand = () => {
        const currentBrands = formData.specializedData?.brandsServed || [];
        if (currentBrand && !currentBrands.includes(currentBrand)) {
            onSpecializedChange('brandsServed', [...currentBrands, currentBrand]);
            setCurrentBrand('');
        }
    };

    const handleRemoveBrand = (brandToRemove: string) => {
        const newBrands = (formData.specializedData?.brandsServed || []).filter(b => b !== brandToRemove);
        onSpecializedChange('brandsServed', newBrands);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <Label className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Servicios Principales</Label>
                <div className="flex flex-wrap gap-2">
                    {automotiveServicesOptions.map(service => (
                        <Button
                            key={service}
                            variant={(formData.specializedData?.mainServices || []).includes(service) ? 'default' : 'outline'}
                            onClick={() => handleServiceChange(service)}
                        >
                            {service}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="brandsServed" className="flex items-center gap-2"><Car className="w-4 h-4"/> Marcas Atendidas</Label>
                 <div className="flex gap-2">
                    <Input id="brandsServed" placeholder="Ej: Toyota, Ford, Chery..." value={currentBrand} onChange={(e) => setCurrentBrand(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBrand(); }}}/>
                    <Button onClick={handleAddBrand} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.specializedData?.brandsServed || []).map(brand => (
                        <Badge key={brand} variant="secondary">{brand}<button onClick={() => handleRemoveBrand(brand)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="certifications">Certificaciones o Cursos (Opcional)</Label>
                <Textarea id="certifications" placeholder="Ej: Certificado en Sistemas de Inyección, Curso de Cajas Automáticas..." value={formData.specializedData?.certifications || ''} onChange={(e) => onSpecializedChange('certifications', e.target.value)} rows={2}/>
            </div>
        </div>
    );
};
