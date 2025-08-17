
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from "@/components/ui/badge";
import { Home, Wrench, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

const mainTradesOptions = ["Plomería", "Electricidad", "Albañilería", "Carpintería", "Jardinería", "Pintura"];

export const HomeRepairFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleTradeChange = (trade: string) => {
        const currentTrades = formData.specializedData?.mainTrades || [];
        const newTrades = currentTrades.includes(trade)
            ? currentTrades.filter(t => t !== trade)
            : [...currentTrades, trade];
        onSpecializedChange('mainTrades', newTrades);
    };

    const handleAddSkill = () => {
        const currentSkills = formData.specializedData?.specificSkills || [];
        if (currentSkill && !currentSkills.includes(currentSkill)) {
            onSpecializedChange('specificSkills', [...currentSkills, currentSkill]);
            setCurrentSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        const newSkills = (formData.specializedData?.specificSkills || []).filter(s => s !== skillToRemove);
        onSpecializedChange('specificSkills', newSkills);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <Label className="flex items-center gap-2"><Home className="w-4 h-4"/> Oficios Principales</Label>
                <div className="flex flex-wrap gap-2">
                    {mainTradesOptions.map(trade => (
                        <Button
                            key={trade}
                            variant={(formData.specializedData?.mainTrades || []).includes(trade) ? 'default' : 'outline'}
                            onClick={() => handleTradeChange(trade)}
                        >
                            {trade}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="specificSkills" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Habilidades Específicas</Label>
                <div className="flex gap-2">
                    <Input id="specificSkills" placeholder="Ej: Instalación de Drywall" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}/>
                    <Button onClick={handleAddSkill} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.specializedData?.specificSkills || []).map(skill => (
                        <Badge key={skill} variant="secondary">{skill}<button onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="certifications">Certificaciones (Opcional)</Label>
                <Textarea id="certifications" placeholder="Ej: Certificado de Gas, Trabajo en alturas..." value={formData.specializedData?.certifications || ''} onChange={(e) => onSpecializedChange('certifications', e.target.value)} rows={2}/>
            </div>
        </div>
    );
};
