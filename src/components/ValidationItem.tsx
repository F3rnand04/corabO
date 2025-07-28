
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

type ValidationStatus = 'idle' | 'pending' | 'validated';

interface ValidationItemProps {
    label: string;
    value: string;
    initialStatus?: ValidationStatus;
    isEditable?: boolean;
    onValidate?: () => void;
}

export function ValidationItem({ 
    label, 
    value: initialValue, 
    initialStatus = 'idle',
    isEditable = true,
    onValidate 
}: ValidationItemProps) {
    const [status, setStatus] = useState<ValidationStatus>(initialStatus);
    const [code, setCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [currentValue, setCurrentValue] = useState(initialValue);
    const { toast } = useToast();

    const handleStartValidation = () => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setCode(newCode);
        setStatus('pending');
        toast({
            title: `Código de Verificación para ${label}`,
            description: `Tu código es: ${newCode}`,
        });
    };

    const handleVerifyCode = () => {
        if (inputCode === code) {
            setStatus('validated');
            if (onValidate) {
                onValidate();
            }
            toast({
                title: '¡Validado!',
                description: `${label} ha sido validado correctamente.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Código Incorrecto',
                description: 'El código que introdujiste no es correcto. Intenta de nuevo.',
            });
        }
    };
    
    return (
        <div className="flex items-center justify-between mt-1">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                {isEditable ? (
                    <Input 
                        className="h-8 text-sm w-auto flex-grow" 
                        value={currentValue} 
                        onChange={(e) => setCurrentValue(e.target.value)} 
                    />
                ) : (
                    <span className="text-sm">{currentValue}</span>
                )}
            </div>

            {status === 'idle' && (
                <Button variant="link" className="p-0 h-auto text-sm font-semibold text-red-500" onClick={handleStartValidation}>
                    Validar
                </Button>
            )}

            {status === 'pending' && (
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
            )}

            {status === 'validated' && (
                 <p className="text-sm font-semibold text-green-600">Validado</p>
            )}
        </div>
    );
}
