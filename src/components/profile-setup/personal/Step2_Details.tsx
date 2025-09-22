'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Briefcase, Package, User } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';

interface StepProps {
    formData: Partial<ProfileSetupData>;
    onUpdate: (data: Partial<ProfileSetupData>) => void;
    onNext: () => void;
}

export default function Step2_Details({ formData, onUpdate, onNext }: StepProps) {
    const offerType = formData.offerType || 'service';
    const isServiceOrBoth = offerType === 'service' || offerType === 'both';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paso 2: Detalles del Perfil</CardTitle>
                <CardDescription>Define tu especialidad y qué tipo de ofertas harás en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="specialty" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Especialidad Principal
                    </Label>
                    <Input 
                        id="specialty" 
                        placeholder="Ej: Fisioterapeuta, Desarrollador Web, Chef" 
                        value={formData.specialty || ''}
                        onChange={(e) => onUpdate({ specialty: e.target.value })}
                    />
                </div>
                <div className="space-y-3">
                    <Label className="flex items-center gap-2">¿Qué ofreces principalmente?</Label>
                    <RadioGroup 
                        value={offerType} 
                        onValueChange={(value) => onUpdate({ offerType: value as any })}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <Label htmlFor="service" className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="service" id="service" className="sr-only"/>
                            <Briefcase className="w-8 h-8 mb-2"/>
                            <span className="font-semibold">Servicios</span>
                        </Label>
                         <Label htmlFor="product" className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="product" id="product" className="sr-only"/>
                            <Package className="w-8 h-8 mb-2"/>
                            <span className="font-semibold">Productos</span>
                        </Label>
                        <Label htmlFor="both" className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="both" id="both" className="sr-only"/>
                             <div className="flex items-center gap-2">
                                <Briefcase className="w-6 h-6"/>
                                <span>+</span>
                                <Package className="w-6 h-6"/>
                            </div>
                            <span className="font-semibold mt-2">Ambos</span>
                        </Label>
                    </RadioGroup>
                </div>

                <Button onClick={onNext} className="w-full" disabled={isServiceOrBoth && !formData.specialty}>
                    Siguiente
                </Button>
            </CardContent>
        </Card>
    );
}
