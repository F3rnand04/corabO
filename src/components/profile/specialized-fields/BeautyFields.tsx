'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scissors, X } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

const beautyTradesOptions = ["Manicure", "Pedicure", "Estilismo", "Maquillaje", "Depilación", "Masajes"];

export const BeautyFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleTradeChange = (trade: string) => {
        const currentTrades = formData.specializedData?.beautyTrades || [];
        const newTrades = currentTrades.includes(trade)
            ? currentTrades.filter(t => t !== trade)
            : [...currentTrades, trade];
        onSpecializedChange('beautyTrades', newTrades);
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
                <Label className="flex items-center gap-2"><Scissors className="w-4 h-4"/> Oficios Principales</Label>
                <div className="flex flex-wrap gap-2">
                    {beautyTradesOptions.map(trade => (
                        <Button
                            key={trade}
                            variant={(formData.specializedData?.beautyTrades || []).includes(trade) ? 'default' : 'outline'}
                            onClick={() => handleTradeChange(trade)}
                        >
                            {trade}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="specificSkills" className="flex items-center gap-2">Otras Habilidades Específicas</Label>
                 <div className="flex gap-2">
                    <Input id="specificSkills" placeholder="Ej: Uñas acrílicas, Peinados..." value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}/>
                    <Button onClick={handleAddSkill} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.specializedData?.specificSkills || []).map(skill => (
                        <Badge key={skill} variant="secondary">{skill}<button onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};
