
"use client";

import { useState, useMemo } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowRight, ChevronLeft, HandCoins, Info, Megaphone, Sparkles, Star, Zap } from 'lucide-react';
import { Slider } from './ui/slider';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

interface CampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function CampaignDialog({ isOpen, onOpenChange }: CampaignDialogProps) {
    const { currentUser, createCampaign } = useCorabo();
    const [step, setStep] = useState(1);
    const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null);
    
    // Step 2 state
    const [budgetLevel, setBudgetLevel] = useState<'basic' | 'advanced' | 'premium'>('basic');
    const [durationDays, setDurationDays] = useState(1);
    
    // Step 3 state
    const [useGeo, setUseGeo] = useState(false);
    const [useInterests, setUseInterests] = useState(false);

    // Step 4 state
    const [useCredicora, setUseCredicora] = useState(false);

    const budgetLevels = {
        basic: { name: 'Básico', dailyRate: 2, impressions: 1500, icon: Megaphone },
        advanced: { name: 'Avanzado', dailyRate: 7, impressions: 8000, icon: Zap },
        premium: { name: 'Premium', dailyRate: 16, impressions: 20000, icon: Sparkles }
    };
    
    const calculatedCosts = useMemo(() => {
        let dailyCost = budgetLevels[budgetLevel].dailyRate;
        if (useGeo) dailyCost *= 1.15;
        if (useInterests) dailyCost *= 1.20;

        let totalCost = dailyCost * durationDays;
        
        const discount = currentUser.isSubscribed ? totalCost * 0.10 : 0;
        const finalCost = totalCost - discount;
        
        let initialPayment = finalCost;
        let financedAmount = 0;
        if(useCredicora && finalCost >= 20){
            const crediLevel = currentUser.credicoraLevel || 1;
            const crediDetails = currentUser.credicoraDetails;
            if(crediDetails){
                 const potentialFinancing = finalCost * (1 - crediDetails.initialPaymentPercentage);
                 financedAmount = Math.min(potentialFinancing, currentUser.credicoraLimit || 0);
                 initialPayment = finalCost - financedAmount;
            }
        }

        return { dailyCost, totalCost, discount, finalCost, initialPayment, financedAmount };
    }, [budgetLevel, durationDays, useGeo, useInterests, useCredicora, currentUser]);


    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleCreateCampaign = () => {
        if (!selectedPublicationId) return;

        createCampaign({
            publicationId: selectedPublicationId,
            budget: calculatedCosts.finalCost,
            durationDays: durationDays,
            budgetLevel: budgetLevel,
            dailyBudget: calculatedCosts.dailyCost,
            segmentation: {
                geographic: useGeo ? ['Este', 'Oeste'] : [],
                interests: useInterests ? ['Tecnología', 'Restaurantes'] : [],
            },
            financedWithCredicora: useCredicora && calculatedCosts.finalCost >= 20,
            appliedSubscriptionDiscount: currentUser.isSubscribed ? 0.10 : 0,
        });

        onOpenChange(false);
        resetState();
    };
    
    const resetState = () => {
        setStep(1);
        setSelectedPublicationId(null);
        setBudgetLevel('basic');
        setDurationDays(1);
        setUseGeo(false);
        setUseInterests(false);
        setUseCredicora(false);
    }

    const renderStepContent = () => {
        switch (step) {
            case 1: // Select Publication
                return (
                    <div className="space-y-4">
                        <DialogDescription>Elige la publicación de tu galería que quieres impulsar.</DialogDescription>
                        <ScrollArea className="h-72">
                            <div className="grid grid-cols-3 gap-2 pr-4">
                                {currentUser.gallery?.map(img => (
                                    <div 
                                        key={img.id} 
                                        className={cn("relative aspect-square rounded-md overflow-hidden cursor-pointer border-4", selectedPublicationId === img.id ? 'border-primary' : 'border-transparent')}
                                        onClick={() => setSelectedPublicationId(img.id)}
                                    >
                                        <Image src={img.src} alt={img.alt} layout="fill" objectFit="cover" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button onClick={handleNext} disabled={!selectedPublicationId}>Siguiente</Button>
                        </DialogFooter>
                    </div>
                );
            case 2: // Configure Budget
                return (
                     <div className="space-y-6">
                        <DialogDescription>Define el presupuesto y la duración de tu campaña.</DialogDescription>
                        <div className="space-y-2">
                            <Label>Nivel de Impulso</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(budgetLevels).map(([key, value]) => (
                                    <Button key={key} variant={budgetLevel === key ? 'default' : 'outline'} className="h-20 flex-col gap-1" onClick={() => setBudgetLevel(key as any)}>
                                        <value.icon className="w-6 h-6"/>
                                        <span className="text-xs">{value.name}</span>
                                        <span className="text-xs font-mono">${value.dailyRate}/día</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Duración</Label>
                                <Badge>{durationDays} día(s)</Badge>
                            </div>
                            <Slider value={[durationDays]} onValueChange={(v) => setDurationDays(v[0])} min={1} max={30} step={1} />
                        </div>
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Alcance Estimado Diario</AlertTitle>
                            <AlertDescription>~{budgetLevels[budgetLevel].impressions.toLocaleString('es-VE')} impresiones</AlertDescription>
                        </Alert>
                         <DialogFooter>
                            <Button variant="outline" onClick={handleBack}>Atrás</Button>
                            <Button onClick={handleNext}>Siguiente</Button>
                        </DialogFooter>
                     </div>
                );
            case 3: // Segmentation
                return (
                     <div className="space-y-6">
                        <DialogDescription>Añade capas de segmentación para llegar a tu público ideal (opcional).</DialogDescription>
                        <div className="space-y-4 rounded-md border p-4">
                           <div className="flex items-center justify-between">
                             <Label htmlFor="geo-segment" className="flex-grow pr-4">
                                Segmentación Geográfica
                                <span className="block text-xs text-muted-foreground">Enfoca en zonas específicas de la ciudad. (+15% costo)</span>
                             </Label>
                             <Switch id="geo-segment" checked={useGeo} onCheckedChange={setUseGeo} />
                           </div>
                           <Separator/>
                           <div className="flex items-center justify-between">
                             <Label htmlFor="interest-segment" className="flex-grow pr-4">
                                Segmentación por Intereses
                                <span className="block text-xs text-muted-foreground">Llega a usuarios interesados en otras categorías. (+20% costo)</span>
                             </Label>
                             <Switch id="interest-segment" checked={useInterests} onCheckedChange={setUseInterests} />
                           </div>
                        </div>
                        <Alert>
                            <HandCoins className="h-4 w-4" />
                            <AlertTitle>Costo Diario Estimado</AlertTitle>
                            <AlertDescription>${calculatedCosts.dailyCost.toFixed(2)}</AlertDescription>
                        </Alert>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleBack}>Atrás</Button>
                            <Button onClick={handleNext}>Revisar y Pagar</Button>
                        </DialogFooter>
                     </div>
                );
            case 4: // Review and Pay
                return (
                     <div className="space-y-4">
                        <DialogDescription>Revisa el resumen final de tu campaña.</DialogDescription>
                         <div className="p-4 rounded-lg border bg-muted/50 space-y-2 text-sm">
                            <div className="flex justify-between"><span>Costo base:</span><span className="font-mono">${(budgetLevels[budgetLevel].dailyRate * durationDays).toFixed(2)}</span></div>
                             {(useGeo || useInterests) && <div className="flex justify-between"><span>Cargos por segmentación:</span><span className="font-mono">+${(calculatedCosts.totalCost - (budgetLevels[budgetLevel].dailyRate * durationDays)).toFixed(2)}</span></div>}
                            <Separator/>
                             <div className="flex justify-between font-semibold"><span>Subtotal:</span><span className="font-mono">${calculatedCosts.totalCost.toFixed(2)}</span></div>
                             {currentUser.isSubscribed && <div className="flex justify-between text-green-600"><span>Descuento de Suscriptor (10%):</span><span className="font-mono">-${calculatedCosts.discount.toFixed(2)}</span></div>}
                             <Separator/>
                             <div className="flex justify-between font-bold text-base"><span>Total Campaña:</span><span className="font-mono">${calculatedCosts.finalCost.toFixed(2)}</span></div>
                         </div>
                         {calculatedCosts.finalCost >= 20 && (
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="use-credicora" className="flex items-center gap-2 font-medium text-blue-600">
                                    <Star className="w-5 h-5 fill-current"/>
                                    Pagar con Credicora
                                </Label>
                                <Switch id="use-credicora" checked={useCredicora} onCheckedChange={setUseCredicora}/>
                            </div>
                         )}
                         {useCredicora && calculatedCosts.finalCost >= 20 && (
                            <div className="p-3 text-center bg-blue-50 border border-blue-200 rounded-md text-blue-900">
                                <p className="font-bold">Total a Pagar Hoy: ${calculatedCosts.initialPayment.toFixed(2)}</p>
                                <p className="text-xs">El resto (${calculatedCosts.financedAmount.toFixed(2)}) se financiará en tus cuotas de Credicora.</p>
                            </div>
                         )}
                         <DialogFooter>
                            <Button variant="outline" onClick={handleBack}>Atrás</Button>
                            <Button onClick={handleCreateCampaign}>Confirmar y Proceder al Pago</Button>
                        </DialogFooter>
                     </div>
                );
            default: return null;
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if(!open) resetState();
            onOpenChange(open);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step > 1 && <Button variant="ghost" size="icon" onClick={handleBack} className="h-7 w-7"><ChevronLeft/></Button>}
                        Gestor de Campañas
                    </DialogTitle>
                </DialogHeader>
                {renderStepContent()}
            </DialogContent>
        </Dialog>
    );
}

