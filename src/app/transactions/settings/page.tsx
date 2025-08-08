
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FileUp, AlertCircle, Loader2, Banknote, Smartphone, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VerificationOutput } from '@/lib/types';
import { ValidationItem } from '@/components/ValidationItem';
import { Switch } from '../ui/switch';


function SettingsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold">Ajustes de Registro</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

const banks = [
    "Banco de Venezuela",
    "Banesco",
    "Banco Mercantil",
    "Banco Provincial",
    "Bancamiga",
    "Banco Nacional de Crédito (BNC)",
    "Otro"
];


export default function TransactionsSettingsPage() {
    const { currentUser, activateTransactions, autoVerifyIdWithAI, setIdVerificationPending, sendMessage, updateUser, validateEmail } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    
    // Step 1 state
    const [idImage, setIdImage] = useState<string | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [isVerifyingId, setIsVerifyingId] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationOutput | null>(null);
    const [idVerificationError, setIdVerificationError] = useState<string | null>(null);
    const idFileInputRef = useRef<HTMLInputElement>(null);

    // Step 2 state
    const [paymentMethods, setPaymentMethods] = useState(currentUser?.profileSetupData?.paymentDetails || {
        account: { active: false, bankName: '', accountNumber: '' },
        mobile: { active: false, bankName: '', mobilePaymentPhone: '' },
        crypto: { active: false, binanceEmail: currentUser?.email || '', validated: false }
    });
    
    const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
    const [accountVerificationError, setAccountVerificationError] = useState<string | null>(null);

    if (!currentUser) {
        return <Loader2 className="animate-spin" />;
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdFile(file);
            setIdVerificationError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                setIdImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleVerifyDocument = async () => {
        if (!idImage || !idFile) {
            toast({ variant: 'destructive', title: 'No hay imagen', description: 'Por favor, sube una imagen de tu cédula para continuar.' });
            return;
        }

        setIsVerifyingId(true);
        setVerificationResult(null);
        setIdVerificationError(null);
        
        try {
            await setIdVerificationPending(currentUser.id, idImage);
            
            const result = await autoVerifyIdWithAI({
                userId: currentUser.id,
                nameInRecord: `${currentUser.name} ${currentUser.lastName || ''}`.trim(),
                idInRecord: currentUser.idNumber || '',
                documentImageUrl: idImage,
            });

            setVerificationResult(result);

            if (!result.nameMatch || !result.idMatch) {
                setIdVerificationError("Los datos no coinciden. Si crees que hubo un error durante tu registro inicial, por favor");
            }

        } catch (error) {
            console.error(error);
            setIdVerificationError("Hubo un error al procesar tu documento. Intenta de nuevo o");
        } finally {
            setIsVerifyingId(false);
        }
    };

    const handleContactSupport = () => {
        const supportMessage = "Hola, necesito ayuda para corregir mis datos de registro de identidad. Cometí un error al ingresarlos.";
        const conversationId = sendMessage('corabo-admin', supportMessage);
        router.push(`/messages/${conversationId}`);
    };

    const handleMethodChange = (method: 'account' | 'mobile' | 'crypto', field: string, value: any) => {
        setPaymentMethods((prev: any) => ({
            ...prev,
            [method]: {
                ...prev[method],
                [field]: value
            }
        }));
    };

    const handleVerifyAccount = () => {
        setAccountVerificationError(null);
        const activeMethods = Object.entries(paymentMethods).filter(([, details]: [string, any]) => details.active);
        
        if(activeMethods.length === 0) {
            setAccountVerificationError("Debes activar y configurar al menos un método de pago.");
            return;
        }

        // Validation for each active method
        for (const [key, details] of activeMethods) {
            const typedDetails = details as any;
            if (key === 'account' && (!typedDetails.bankName || typedDetails.accountNumber.length !== 20)) {
                setAccountVerificationError("Los datos de la cuenta bancaria son incorrectos o incompletos.");
                return;
            }
             if (key === 'mobile' && (!typedDetails.bankName || !typedDetails.mobilePaymentPhone)) {
                setAccountVerificationError("Los datos de Pago Móvil son incorrectos o incompletos.");
                return;
            }
            if (key === 'crypto' && !typedDetails.validated) {
                setAccountVerificationError("Debes validar tu correo de Binance Pay antes de continuar.");
                return;
            }
        }


        setIsVerifyingAccount(true);

        setTimeout(() => {
            activateTransactions(currentUser.id, paymentMethods);

            toast({
                title: "¡Módulo Activado!",
                description: "Tus métodos de pago han sido guardados exitosamente.",
                className: "bg-green-100 border-green-300 text-green-800",
            });
            
            router.push('/transactions');

            setIsVerifyingAccount(false);
        }, 1500);
    }
    
    const handleBinanceEmailValidation = async (email: string) => {
        const success = await validateEmail(currentUser.id, email);
        if (success) {
            handleMethodChange('crypto', 'validated', true);
            handleMethodChange('crypto', 'binanceEmail', email); // Persist validated email
        }
        return success;
    };


    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto">
                <Card>
                   {step === 1 && (
                     <>
                        <CardHeader>
                            <CardTitle>Paso 1: Verificación de Identidad</CardTitle>
                            <CardDescription>
                                Para activar tu registro de transacciones, necesitamos verificar tu identidad. 
                                Por favor, sube una foto clara y legible de tu cédula de identidad.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div
                                className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:bg-muted/50 transition-colors relative"
                                onClick={() => idFileInputRef.current?.click()}
                            >
                                <input
                                    ref={idFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {idImage ? (
                                    <Image src={idImage} layout="fill" objectFit="contain" alt="Vista previa de la cédula" />
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <FileUp className="w-12 h-12 mb-2" />
                                        <p className="font-semibold">Haz clic para subir una imagen</p>
                                        <p className="text-xs">Asegúrate de que sea clara y todos los datos sean legibles.</p>
                                    </div>
                                )}
                            </div>
                            
                            {!verificationResult && (
                               <Button 
                                    className="w-full" 
                                    size="lg" 
                                    onClick={handleVerifyDocument}
                                    disabled={isVerifyingId || !idImage}
                                >
                                    {isVerifyingId ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</> : "Enviar y Verificar Documento"}
                                </Button>
                            )}


                            {idVerificationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error de Verificación</AlertTitle>
                                    <AlertDescription>
                                        {idVerificationError}{' '}
                                        <Button variant="link" className="p-0 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte.</Button>
                                    </AlertDescription>
                                </Alert>
                            )}

                             {verificationResult && (
                                <div className="space-y-4">
                                     <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {verificationResult.nameMatch && verificationResult.idMatch ? <CheckCircle className="text-green-600"/> : <XCircle className="text-destructive"/>}
                                                Resultado de la Verificación
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className={cn("flex justify-between p-2 rounded-md", verificationResult.nameMatch ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                                                <span>Nombre en documento:</span>
                                                <span className="font-semibold">{verificationResult.extractedName}</span>
                                            </div>
                                             <div className={cn("flex justify-between p-2 rounded-md", verificationResult.idMatch ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                                                <span>Cédula en documento:</span>
                                                <span className="font-semibold">{verificationResult.extractedId}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                     <Button className="w-full" onClick={() => setStep(2)} disabled={!verificationResult.nameMatch || !verificationResult.idMatch}>
                                        Continuar al Siguiente Paso
                                    </Button>
                                </div>
                            )}
                            
                        </CardContent>
                     </>
                   )}
                   {step === 2 && (
                     <>
                        <CardHeader>
                            <CardTitle>Paso 2: Registro de Métodos de Pago</CardTitle>
                            <CardDescription>
                               Activa y configura los métodos donde recibirás tus pagos. Deben estar a tu nombre.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* Bank Account */}
                            <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="account-switch" className="flex items-center gap-2 font-medium">
                                        <Banknote className="w-5 h-5"/>
                                        Cuenta Bancaria
                                    </Label>
                                    <Switch id="account-switch" checked={paymentMethods.account.active} onCheckedChange={(c) => handleMethodChange('account', 'active', c)} />
                                </div>
                                {paymentMethods.account.active && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-name">Entidad Bancaria</Label>
                                            <Select onValueChange={(v) => handleMethodChange('account', 'bankName', v)} value={paymentMethods.account.bankName}>
                                                <SelectTrigger id="bank-name"><SelectValue placeholder="Selecciona un banco" /></SelectTrigger>
                                                <SelectContent>{banks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-number">Número de Cuenta (20 dígitos)</Label>
                                            <Input id="account-number" placeholder="0102..." value={paymentMethods.account.accountNumber} onChange={(e) => handleMethodChange('account', 'accountNumber', e.target.value)} maxLength={20} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Payment */}
                            <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="mobile-switch" className="flex items-center gap-2 font-medium">
                                        <Smartphone className="w-5 h-5"/>
                                        Pago Móvil
                                    </Label>
                                    <Switch id="mobile-switch" checked={paymentMethods.mobile.active} onCheckedChange={(c) => handleMethodChange('mobile', 'active', c)} />
                                </div>
                                {paymentMethods.mobile.active && (
                                     <div className="space-y-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <Label htmlFor="mobile-id">Cédula</Label>
                                            <Input id="mobile-id" value={currentUser.idNumber} readOnly disabled />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="mobile-bank-name">Entidad Bancaria</Label>
                                            <Select onValueChange={(v) => handleMethodChange('mobile', 'bankName', v)} value={paymentMethods.mobile.bankName}>
                                                <SelectTrigger id="mobile-bank-name"><SelectValue placeholder="Selecciona un banco" /></SelectTrigger>
                                                <SelectContent>{banks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mobile-phone">Número de Teléfono</Label>
                                            <Input id="mobile-phone" placeholder="0412..." value={paymentMethods.mobile.mobilePaymentPhone} onChange={(e) => handleMethodChange('mobile', 'mobilePaymentPhone', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Binance Pay */}
                             <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="crypto-switch" className="flex items-center gap-2 font-medium">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.714 6.556H14.15l2.031 2.031-2.03 2.032h2.563l2.032-2.031-2.03-2.032Zm-4.582 4.583H9.57l2.032 2.03-2.031 2.031h2.562l2.032-2.03-2.032-2.032Zm-4.582 0H5.087l2.032 2.03-2.032 2.031H7.55l2.032-2.03-2.032-2.032Zm9.164-2.551h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03Zm-4.582-4.582H9.57l2.032 2.03-2.031 2.032h2.562l2.032-2.03-2.032-2.031Zm4.582 9.164h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03ZM9.62 2.01l-7.61 7.61 2.032 2.031 7.61-7.61L9.62 2.01Zm0 17.98l-7.61-7.61 2.032-2.032 7.61 7.61-2.032 2.032Z" fill="#F0B90B"></path></svg>
                                        Binance Pay
                                    </Label>
                                    <Switch id="crypto-switch" checked={paymentMethods.crypto.active} onCheckedChange={(c) => handleMethodChange('crypto', 'active', c)} />
                                </div>
                                {paymentMethods.crypto.active && (
                                     <div className="space-y-4 pt-4 border-t">
                                        <ValidationItem
                                            label="Correo de Binance:"
                                            value={paymentMethods.crypto.binanceEmail}
                                            initialStatus={paymentMethods.crypto.validated ? 'validated' : 'idle'}
                                            onValidate={handleBinanceEmailValidation}
                                            onValueChange={(v) => handleMethodChange('crypto', 'binanceEmail', v)}
                                        />
                                    </div>
                                )}
                            </div>


                             {accountVerificationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error de Verificación</AlertTitle>
                                    <AlertDescription>
                                        {accountVerificationError}
                                    </AlertDescription>
                                </Alert>
                            )}

                             <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleVerifyAccount}
                                disabled={isVerifyingAccount}
                            >
                                {isVerifyingAccount ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando y Activando...
                                    </>
                                ) : (
                                    "Guardar Métodos y Activar Módulo"
                                )}
                            </Button>
                        </CardContent>
                     </>
                   )}
                </Card>
            </main>
        </>
    );
}
