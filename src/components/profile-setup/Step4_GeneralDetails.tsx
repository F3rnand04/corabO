
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, MessageSquare, User, ScanLine, Cake, Contact } from "lucide-react";
import { ValidationItem } from "@/components/ValidationItem";
import { useCorabo } from "@/contexts/CoraboContext";
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';


interface Step4_GeneralDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
}

export default function Step4_GeneralDetails({ onBack, onNext, formData, setFormData }: Step4_GeneralDetailsProps) {
  const { currentUser, validateEmail, updateUser, sendMessage } = useCorabo();
  const router = useRouter();
  
  const isIdentityComplete = currentUser?.lastName && currentUser?.idNumber && currentUser?.birthDate;

  const handleContactSupport = () => {
    const supportMessage = "Hola, necesito ayuda para corregir mis datos de registro de identidad. Cometí un error al ingresarlos.";
    const conversationId = sendMessage({recipientId: 'corabo-admin', text: supportMessage});
    router.push(`/messages/${conversationId}`);
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold">Paso 4: Datos Personales</h2>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={currentUser?.name || ''} readOnly disabled />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" value={currentUser?.lastName || ''} readOnly disabled />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="idNumber">Documento de Identidad</Label>
                    <Input id="idNumber" value={currentUser?.idNumber || ''} readOnly disabled />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input id="birthDate" type="date" value={currentUser?.birthDate || ''} readOnly disabled />
                </div>
            </div>

            {isIdentityComplete && (
                 <Alert variant="warning">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Información de Identidad Protegida</AlertTitle>
                    <AlertDescription>
                        Por seguridad, estos datos no se pueden modificar. Si necesitas corregirlos, por favor
                        <Button variant="link" className="p-1 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte</Button>.
                    </AlertDescription>
                </Alert>
            )}

            <p className="text-sm text-muted-foreground pt-2">Esta información es privada y se utilizará para verificar tu identidad al activar funciones de pago. No será visible para otros usuarios.</p>

            <ValidationItem
                label="Correo Electrónico:"
                value={currentUser?.email || ''}
                initialStatus={currentUser?.emailValidated ? 'validated' : 'idle'}
                onValidate={() => validateEmail(currentUser!.id, currentUser?.email || '')}
                onValueChange={(value) => updateUser(currentUser!.id, { email: value })}
                type="email"
            />
             <ValidationItem
                label="Teléfono:"
                value={currentUser?.phone || ''}
                initialStatus={currentUser?.phoneValidated ? 'validated' : 'idle'}
                onValueChange={(value) => updateUser(currentUser!.id, { phone: value })}
                type="phone"
            />
        </div>
        
        <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">¡Aumenta tu confianza!</AlertTitle>
            <AlertDescription>
                Valida tus datos para mejorar tu <strong>reputación, efectividad y credibilidad</strong> en la plataforma.
                Tu número de teléfono es para uso interno y <strong>nunca</strong> se compartirá con otros usuarios.
            </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Atrás</Button>
            <Button onClick={onNext}>Siguiente</Button>
        </div>
    </div>
  );
}
