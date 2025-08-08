

'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, MessageSquare, User, ScanLine, Cake } from "lucide-react";
import { ValidationItem } from "@/components/ValidationItem";
import { useCorabo } from "@/contexts/CoraboContext";
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface Step4_GeneralDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step4_GeneralDetails({ onBack, onNext, formData, setFormData }: Step4_GeneralDetailsProps) {
  const { currentUser, validateEmail, updateUser } = useCorabo();

  const handleValueChange = (field: 'name' | 'lastName' | 'idNumber' | 'birthDate' | 'phone' | 'email', value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  
  useEffect(() => {
    setFormData({
      ...formData,
      name: currentUser.name,
      lastName: currentUser.lastName || '',
      idNumber: currentUser.idNumber || '',
      birthDate: currentUser.birthDate || '',
      email: currentUser.email,
      phone: currentUser.phone
    });
  }, [currentUser]);
  
  const isDataComplete = formData.lastName && formData.idNumber && formData.birthDate;

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold">Paso 4: Datos Personales</h2>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={formData.name || ''} readOnly disabled />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" placeholder="Tu apellido" value={formData.lastName || ''} onChange={(e) => handleValueChange('lastName', e.target.value)} />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="idNumber">Cédula de Identidad</Label>
                    <Input id="idNumber" placeholder="V-12345678" value={formData.idNumber || ''} onChange={(e) => handleValueChange('idNumber', e.target.value)} />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input id="birthDate" type="date" value={formData.birthDate || ''} onChange={(e) => handleValueChange('birthDate', e.target.value)} />
                </div>
            </div>

            <p className="text-sm text-muted-foreground pt-2">Esta información es privada y se utilizará para verificar tu identidad al activar funciones de pago. No será visible para otros usuarios.</p>

            <ValidationItem
                label="Correo Electrónico:"
                value={formData.email}
                initialStatus={currentUser.emailValidated ? 'validated' : 'idle'}
                onValidate={() => validateEmail(currentUser.id, formData.email)}
                onValueChange={(value) => updateUser(currentUser.id, { email: value })}
                type="email"
            />
             <ValidationItem
                label="Teléfono:"
                value={formData.phone}
                initialStatus={currentUser.phoneValidated ? 'validated' : 'idle'}
                onValueChange={(value) => updateUser(currentUser.id, { phone: value })}
                type="phone"
            />
        </div>
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>¡Aumenta tu confianza!</AlertTitle>
            <AlertDescription>
                Valida tus datos para mejorar tu <strong>reputación, efectividad y credibilidad</strong> en la plataforma.
                Tu número de teléfono es para uso interno y <strong>nunca</strong> se compartirá con otros usuarios.
            </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Atrás</Button>
            <Button onClick={onNext} disabled={!isDataComplete}>Siguiente</Button>
        </div>
    </div>
  );
}
