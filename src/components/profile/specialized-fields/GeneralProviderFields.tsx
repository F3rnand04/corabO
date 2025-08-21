'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Briefcase, Wrench, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

export const GeneralProviderFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleAddSkill = () => {
        const fieldData = formData.specializedData?.keySkills || [];
        if (currentSkill && !fieldData.includes(currentSkill)) {
            onSpecializedChange('keySkills', [...fieldData, currentSkill]);
            setCurrentSkill('');
        }
    };
    
    const handleRemoveSkill = (skillToRemove: string) => {
        const newSkills = (formData.specializedData?.keySkills || []).filter(s => s !== skillToRemove);
        onSpecializedChange('keySkills', newSkills);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="keySkills" className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Habilidades Clave</Label>
                <div className="flex gap-2">
                    <Input id="keySkills" placeholder="Ej: Desarrollo Web, Figma" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}/>
                    <Button onClick={handleAddSkill} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {formData.specializedData?.keySkills?.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}<button onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="toolsAndBrands" className="flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> Herramientas y Marcas</Label>
                <Textarea id="toolsAndBrands" placeholder="Ej: Adobe Photoshop, Wella, OPI" value={formData.specializedData?.toolsAndBrands || ''} onChange={(e) => onSpecializedChange('toolsAndBrands', e.target.value)} rows={2}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="yearsOfExperience" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Años de Experiencia</Label>
                <Input id="yearsOfExperience" type="number" placeholder="Ej: 5" value={formData.specializedData?.yearsOfExperience || ''} onChange={(e) => onSpecializedChange('yearsOfExperience', parseInt(e.target.value, 10) || undefined)}/>
            </div>
        </div>
    );
};
