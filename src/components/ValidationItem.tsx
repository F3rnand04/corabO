

"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

type ValidationStatus = 'idle' | 'pending' | 'validated';

interface ValidationItemProps {
    label: string;
    value: string;
    initialStatus?: 'idle' | 'validated';
    onValidate?: (valueToValidate: string) => Promise<boolean>;
    onValueChange?: (value: string) => void;
}

export function ValidationItem({ 
    label, 
    value: initialValue, 
    initialStatus = 'idle',
    onValidate,
    onValueChange,
}: ValidationItemProps) {
    const [status, setStatus] = useState<ValidationStatus>(initialStatus);
    const [code, setCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [currentValue, setCurrentValue] = useState(initialValue);
    const { toast } = useToast();

    const handleStartValidation = () => {
        if (!currentValue) {
            toast({ variant: 'destructive', title: 'Campo vacío', description: 'Por favor, introduce un valor para validar.' });
            return;
        }
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setCode(newCode);
        setStatus('pending');
        toast({
            title: `Código de Verificación para ${label}`,
            description: `Tu código es: ${newCode}`,
        });
    };
    
    const handleVerifyCode = async () => {
        if (inputCode === code) {
            if (onValidate) {
                const isValidated = await onValidate(currentValue);
                if (isValidated) {
                    setStatus('validated');
                    toast({
                        title: '¡Validado!',
                        description: `${label} ha sido validado correctamente.`,
                        className: "bg-green-100 border-green-300 text-green-800",
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: 'Error de Validación',
                        description: 'No se pudo completar la validación. Intenta de nuevo.',
                    });
                }
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Código Incorrecto',
                description: 'El código que introdujiste no es correcto. Intenta de nuevo.',
            });
        }
    };
    
    if (status === 'validated') {
        return (
             <div className="flex items-center justify-between mt-1 h-9">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm">{currentValue}</span>
                </div>
                 <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Validado</p>
            </div>
        );
    }
    
     if (status === 'idle') {
         return (
             <div className="flex items-center justify-between mt-1 h-9">
                 <div className="flex items-center gap-2 flex-grow">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Input 
                        className="h-8 text-sm w-auto flex-grow" 
                        value={currentValue} 
                        placeholder={`Añade tu ${label.toLowerCase().replace(':', '')}`}
                        onChange={(e) => {
                            setCurrentValue(e.target.value);
                            if (onValueChange) onValueChange(e.target.value);
                        }}
                    />
                </div>
                <Button variant="link" className="p-0 h-auto text-sm font-semibold" onClick={handleStartValidation}>
                    Validar
                </Button>
            </div>
         )
     }

    return (
        <div className="flex items-center justify-between mt-1 h-9">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm">{currentValue}</span>
            </div>

            <div className="flex items-center gap-2">
                <Input 
                    type="text"
                    placeholder="Código"
                    maxLength={4}
                    className="h-8 w-24 text-sm"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                />
                <Button size="sm" className="h-8 text-xs" onClick={handleVerifyCode}>
                    Verificar
                </Button>
            </div>
        </div>
    );
}
