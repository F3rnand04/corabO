
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/data/options';
import { setExchangeRate } from '@/lib/actions/exchange-rate.actions';

interface ExchangeRateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ExchangeRateDialog({ isOpen, onOpenChange }: ExchangeRateDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state
    const [countryCode, setCountryCode] = useState('');
    const [rate, setRate] = useState('');

    const resetForm = () => {
        setCountryCode('');
        setRate('');
        setIsLoading(false);
    }
    
    const handleSaveChanges = async () => {
        if (!countryCode || !rate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un país y establecer una tasa.' });
            return;
        }
        const numericRate = parseFloat(rate);
        if (isNaN(numericRate) || numericRate <= 0) {
            toast({ variant: 'destructive', title: 'Tasa Inválida', description: 'La tasa debe ser un número positivo.' });
            return;
        }

        setIsLoading(true);
        try {
            await setExchangeRate(countryCode, numericRate);
            toast({ title: 'Tasa Actualizada', description: `La tasa para ${countryCode} ha sido establecida a ${numericRate}.` });
            resetForm();
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al Guardar', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            onOpenChange(open);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gestionar Tasa de Cambio</DialogTitle>
                    <DialogDescription>
                        Establece la tasa de cambio del día para un país específico. Este valor se usará en toda la plataforma.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                         <Select onValueChange={setCountryCode} value={countryCode}>
                            <SelectTrigger id="country">
                                <SelectValue placeholder="Selecciona un país..." />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rate">Nueva Tasa</Label>
                        <Input id="rate" type="number" placeholder="Ej: 151.50" value={rate} onChange={(e) => setRate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSaveChanges} disabled={isLoading || !countryCode || !rate}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Tasa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
