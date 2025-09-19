'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { sendSmsVerificationCode, verifySmsCode } from '@/lib/actions/sms.actions'; 
import { useAuth } from '@/hooks/use-auth-provider';

type ValidationStatus = 'idle' | 'pending' | 'validated';

interface ValidationItemProps {
    label: string;
    value: string;
    initialStatus?: 'idle' | 'validated';
    onValidate?: (valueToValidate: string) => Promise<boolean>;
    onValueChange?: (value: string) => void;
    type?: 'email' | 'phone';
    userId?: string;
}

export function ValidationItem({ 
    label, 
    value: initialValue, 
    initialStatus = 'idle',
    onValidate,
    onValueChange,
    type,
    userId
}: ValidationItemProps) {
    const { currentUser } = useAuth();
    const firebaseUser = currentUser; 

    const [status, setStatus] = useState<ValidationStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [currentValue, setCurrentValue] = useState(initialValue);
    const { toast } = useToast();

    const handleStartValidation = async () => {
        if (!currentValue) {
            toast({ variant: 'destructive', title: 'Campo vacío', description: 'Por favor, introduce un valor para validar.' });
            return;
        }
        if (!firebaseUser) return;

        setIsLoading(true);
        try {
            if (type === 'phone') {
                await sendSmsVerificationCode(firebaseUser.id, currentValue);
                setStatus('pending');
                toast({ title: 'Código Enviado', description: 'Revisa tu teléfono para obtener el código de 6 dígitos.'});
            } else if (onValidate) {
                await onValidate(currentValue); // For email
                setStatus('pending');
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al Enviar', description: 'No se pudo enviar la validación.' });
        }
        finally {
            setIsLoading(false);
        }
    };
    
    const handleVerifyCode = async () => {
        if (!firebaseUser) return;
        setIsLoading(true);
        try {
            if (type === 'phone') {
                const result = await verifySmsCode(firebaseUser.id, inputCode);
                if(result.success) {
                    setStatus('validated');
                } else {
                     toast({ variant: 'destructive', title: 'Código Incorrecto', description: 'El código de verificación no es válido.' });
                }
            } else if(onValidate){
                const success = await onValidate(inputCode);
                if(success) setStatus('validated');
            }
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error de Verificación', description: 'No se pudo completar la verificación.' });
        }
        finally {
            setIsLoading(false);
        }
    };
    
    if (status === 'validated') {
        return (
             <div className="flex items-center justify-between mt-1 h-9">
                <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">{label}</Label>
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
                    <Label className="text-sm text-muted-foreground">{label}</Label>
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
                <Button variant="link" className="p-0 h-auto text-sm font-semibold" onClick={handleStartValidation} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Validar'}
                </Button>
            </div>
         )
     }

    // Pending status
    return (
        <div className="flex items-center justify-between mt-1 h-9">
            <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">{label}</Label>
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
                <Button size="sm" className="h-8 text-xs" onClick={handleVerifyCode} disabled={isLoading}>
                     {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Verificar'}
                </Button>
            </div>
        </div>
    );
}
