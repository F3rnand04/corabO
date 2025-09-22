
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, Phone, Check, Loader2 } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';
import { generateQrCode } from '@/lib/actions/qr-code.actions';
import Image from 'next/image';


interface StepProps {
    formData: Partial<ProfileSetupData>;
    onUpdate: (data: Partial<ProfileSetupData>) => void;
    onNext: () => void;
}

export default function Step3_LegalInfo({ formData, onUpdate, onNext }: StepProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [isLoadingQr, setIsLoadingQr] = useState(false);

    const handleFieldChange = (field: 'name' | 'position' | 'idNumber' | 'phone', value: string) => {
        onUpdate({
            legalRepresentative: {
                ...(formData.legalRepresentative || { name: '', idNumber: '' }),
                [field]: value,
            },
        });
    };
    
    useEffect(() => {
        const generateQR = async () => {
            if (formData.legalRepresentative?.idNumber) {
                setIsLoadingQr(true);
                try {
                    const dataUrl = await generateQrCode(formData.legalRepresentative.idNumber);
                    setQrCodeDataUrl(dataUrl);
                } catch (error) {
                    console.error("Failed to generate QR Code", error);
                } finally {
                    setIsLoadingQr(false);
                }
            }
        };
        generateQR();
    }, [formData.legalRepresentative?.idNumber]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Paso 3: Información Legal</CardTitle>
                <CardDescription>Proporciona los datos del representante legal de la empresa. Serán utilizados para la facturación y validación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="rep-name" className="flex items-center gap-2"><User className="w-4 h-4"/> Nombre Completo del Representante</Label>
                    <Input id="rep-name" placeholder="Nombre y Apellido" value={formData.legalRepresentative?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="rep-id" className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Cédula o ID del Representante</Label>
                    <Input id="rep-id" placeholder="V-12345678" value={formData.legalRepresentative?.idNumber || ''} onChange={(e) => handleFieldChange('idNumber', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="rep-phone" className="flex items-center gap-2"><Phone className="w-4 h-4"/> Teléfono del Representante</Label>
                    <Input id="rep-phone" placeholder="0412-1234567" value={formData.legalRepresentative?.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
                </div>
                
                 {qrCodeDataUrl && (
                    <div className="space-y-2 text-center">
                         <Label>Código QR Fiscal (RIF)</Label>
                        <div className="p-4 bg-muted rounded-md inline-block">
                             {isLoadingQr ? (
                                <div className="w-32 h-32 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <Image src={qrCodeDataUrl} alt="QR Code" width={128} height={128} />
                            )}
                        </div>
                    </div>
                )}
                
                <Button onClick={onNext} className="w-full" disabled={!formData.legalRepresentative?.name || !formData.legalRepresentative?.idNumber}>
                    <Check className="mr-2 h-4 w-4"/>
                    Guardar y Continuar
                </Button>
            </CardContent>
        </Card>
    );
}
