
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Star, Zap, CheckCircle } from 'lucide-react';
import { AdvancedQuoteDialog } from './AdvancedQuoteDialog';

const advancedOptions = [
    { id: 'verified', label: 'Usuarios Verificados', icon: CheckCircle },
    { id: 'reputation', label: 'Mejor Reputación', icon: Star },
    { id: 'response', label: 'Respuesta Rápida', icon: Zap },
];


export function AdvancedSearchOptions() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOptionClick = () => {
        // Here you could pass which option was clicked to the dialog if needed
        setIsDialogOpen(true);
    };

    return (
        <>
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-semibold text-center text-foreground">
                Llega a más y mejores proveedores con estas opciones:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {advancedOptions.map(option => (
                    <Button 
                        key={option.id} 
                        variant="outline" 
                        className="flex-col h-20 gap-1 relative overflow-hidden bg-background"
                        onClick={handleOptionClick}
                    >
                        <div className="absolute top-1 right-1">
                             <Lock className="w-3 h-3 text-muted-foreground/70"/>
                        </div>
                        <option.icon className="w-6 h-6 text-primary" />
                        <span className="text-xs font-normal text-center">{option.label}</span>
                    </Button>
                ))}
            </div>
        </div>
        <AdvancedQuoteDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </>
    )
}
