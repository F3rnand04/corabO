

"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';

type ValidationStatus = 'idle' | 'pending' | 'validated';

interface ValidationItemProps {
    label: string;
    value: string;
    initialStatus?: 'idle' | 'validated';
    onValidate?: (valueToValidate: string) => Promise<boolean>;
    onValueChange?: (value: string) => void;
    type?: 'email' | 'phone';
}

export function ValidationItem({ 
    label, 
    value: initialValue, 
    initialStatus = 'idle',
    onValidate,
    onValueChange,
    type,
}: ValidationItemProps) {
    const { currentUser, sendPhoneVerification, verifyPhoneCode } = useCorabo();
    const [status, setStatus] = useState<ValidationStatus>(initialStatus);
    const [inputCode, setInputCode] = useState('');
    const [currentValue, setCurrentValue] = useState(initialValue);
    const { toast } = useToast();

    const handleStartValidation = async () => {
        if (!currentValue) {
            toast({ variant: 'destructive', title: 'Campo vacío', description: 'Por favor, introduce un valor para validar.' });
            return;
        }

        if (type === 'phone' && currentUser) {
            await sendPhoneVerification(currentUser.id, currentValue);
            setStatus('pending');
        } else if (onValidate) {
            await onValidate(currentValue); // For email
            setStatus('pending');
        }
    };
    
    const handleVerifyCode = async () => {
        if (type === 'phone' && currentUser) {
            const success = await verifyPhoneCode(currentUser.id, inputCode);
            if(success) {
                setStatus('validated');
            }
        } else {
            // Logic for email, which might be different or handled by onValidate completely
            // This part might need adjustment if email verification logic changes.
            if(onValidate){
                const success = await onValidate(inputCode); // This is a simplification
                if(success) setStatus('validated');
            }
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
                    maxLength={6}
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
