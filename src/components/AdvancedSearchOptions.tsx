

"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Star, Zap, CheckCircle, Check } from 'lucide-react';
import { AdvancedQuoteDialog } from './AdvancedQuoteDialog';
import { cn } from '@/lib/utils';

const advancedOptions = [
    { id: 'verified', label: 'Usuarios Verificados', icon: CheckCircle },
    { id: 'reputation', label: 'Mejor Reputación', icon: Star },
    { id: 'response', label: 'Respuesta Rápida', icon: Zap },
];

interface AdvancedSearchOptionsProps {
    unlockedOption?: string | null;
}

export function AdvancedSearchOptions({ unlockedOption }: AdvancedSearchOptionsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleOptionClick = (optionId: string) => {
        if (unlockedOption === optionId) return; // Don't open dialog if it's already unlocked
        setSelectedOption(optionId);
        setIsDialogOpen(true);
    };

    return (
        <>
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-semibold text-center text-foreground">
                Llega a más y mejores proveedores con estas opciones:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {advancedOptions.map(option => {
                    const isUnlocked = unlockedOption === option.id;
                    return (
                        <Button 
                            key={option.id} 
                            variant="outline" 
                            className={cn(
                                "flex-col h-20 gap-1 relative overflow-hidden bg-background",
                                isUnlocked && "border-green-500 ring-2 ring-green-500/50"
                            )}
                            onClick={() => handleOptionClick(option.id)}
                        >
                            <div className="absolute top-1 right-1">
                                 {isUnlocked ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                 ) : (
                                    <Lock className="w-3 h-3 text-muted-foreground/70"/>
                                 )}
                            </div>
                            <option.icon className={cn("w-6 h-6", isUnlocked ? "text-green-600" : "text-primary")} />
                            <span className="text-xs font-normal text-center">{option.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
        <AdvancedQuoteDialog 
            isOpen={isDialogOpen} 
            onOpenChange={setIsDialogOpen}
            selectedOption={selectedOption}
        />
        </>
    )
}
