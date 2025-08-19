'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BadgeCheck, Stethoscope, Wrench, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

const professionalOptions = [
    { value: 'office', label: 'En Consultorio' },
    { value: 'home', label: 'A Domicilio' },
    { value: 'online', label: 'En Línea' },
    { value: 'hybrid', label: 'Híbrido (Online y Presencial)' },
];

const companyOptions = [
    { value: 'facilities', label: 'En nuestras instalaciones (Clínica/Centro)' },
    { value: 'ambulance', label: 'Servicio de Ambulancia / A domicilio' },
    { value: 'telemedicine', label: 'Telemedicina (En Línea)' },
    { value: 'hybrid_company', label: 'Híbrido (Instalaciones y Online)' },
];


export const HealthFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSpecialty, setCurrentSpecialty] = useState('');
    const isCompany = formData.providerType === 'company';
    const consultationOptions = isCompany ? companyOptions : professionalOptions;


    const handleAddSpecialty = () => {
        const specialties = formData.specializedData?.specialties || [];
        if (currentSpecialty && !specialties.includes(currentSpecialty)) {
            onSpecializedChange('specialties', [...specialties, currentSpecialty]);
            setCurrentSpecialty('');
        }
    };
    
    const handleRemoveSpecialty = (specToRemove: string) => {
        const newSpecialties = (formData.specializedData?.specialties || []).filter(spec => spec !== specToRemove);
        onSpecializedChange('specialties', newSpecialties);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="flex items-center gap-2"><BadgeCheck className="w-4 h-4"/> Nro. Licencia / Colegiatura / Registro Sanitario</Label>
                <Input id="licenseNumber" placeholder="Ej: MPPS 12345" value={formData.specializedData?.licenseNumber || ''} onChange={(e) => onSpecializedChange('licenseNumber', e.target.value)}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="specialties" className="flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Especialidades Ofrecidas</Label>
                <div className="flex gap-2">
                    <Input id="specialties" placeholder="Ej: Terapia Manual, Cardiología..." value={currentSpecialty} onChange={(e) => setCurrentSpecialty(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); }}}/>
                    <Button onClick={handleAddSpecialty} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.specializedData?.specialties || []).map(spec => (
                        <Badge key={spec} variant="secondary">{spec}<button onClick={() => handleRemoveSpecialty(spec)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="consultationMode" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Modalidad de Atención</Label>
                <Select value={formData.specializedData?.consultationMode || ''} onValueChange={(value) => onSpecializedChange('consultationMode', value)}>
                    <SelectTrigger id="consultationMode"><SelectValue placeholder="Selecciona una modalidad" /></SelectTrigger>
                    <SelectContent>
                        {consultationOptions.map(option => (
                           <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
