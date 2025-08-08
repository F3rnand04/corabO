
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
    const { currentUser, activateTransactions, autoVerifyIdWithAI, setIdVerificationPending, sendMessage } = useCorabo();
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
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'mobile'>('account');
    const [bankAccount, setBankAccount] = useState('');
    const [bankName, setBankName] = useState('');
    const [mobilePaymentPhone, setMobilePaymentPhone] = useState('');
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

    const handleVerifyAccount = () => {
        setAccountVerificationError(null);
        setIsVerifyingAccount(true);

        setTimeout(() => {
            const isAccountInvalid = paymentMethod === 'account' && bankAccount === '123';
            const isMobileInvalid = paymentMethod === 'mobile' && mobilePaymentPhone === '123';

            if (isAccountInvalid || isMobileInvalid) {
                 setAccountVerificationError("El titular de la cuenta/pago móvil no coincide con el propietario de la cuenta Corabo. Por favor, verifica los datos.");
            } else {
                toast({
                    title: "¡Cuenta Verificada!",
                    description: "Tus datos de pago han sido guardados exitosamente. Tu módulo de transacciones está activo.",
                    className: "bg-green-100 border-green-300 text-green-800",
                });
                activateTransactions(currentUser.id, 150);
                router.push('/transactions');
            }
            setIsVerifyingAccount(false);
        }, 2000);
    }

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
                                        {idVerificationError} <Button variant="link" className="p-0 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte.</Button>
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
                            <CardTitle>Paso 2: Registro de Cuenta de Pago</CardTitle>
                            <CardDescription>
                               Registra la cuenta bancaria o pago móvil donde recibirás tus pagos. Debe estar a tu nombre.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-2 rounded-lg bg-muted p-1">
                                <Button 
                                    variant={paymentMethod === 'account' ? 'default' : 'ghost'} 
                                    onClick={() => setPaymentMethod('account')}
                                    className="flex-1"
                                >
                                    <Banknote className="mr-2 h-4 w-4"/>
                                    Cuenta Bancaria
                                </Button>
                                <Button 
                                    variant={paymentMethod === 'mobile' ? 'default' : 'ghost'} 
                                    onClick={() => setPaymentMethod('mobile')}
                                    className="flex-1"
                                >
                                     <Smartphone className="mr-2 h-4 w-4"/>
                                    Pago Móvil
                                </Button>
                            </div>

                            {paymentMethod === 'account' ? (
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="account-name">Titular de la Cuenta</Label>
                                        <Input id="account-name" value={`${currentUser.name} ${currentUser.lastName}`} readOnly disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bank-name">Entidad Bancaria</Label>
                                        <Select onValueChange={setBankName} value={bankName}>
                                            <SelectTrigger id="bank-name">
                                                <SelectValue placeholder="Selecciona un banco" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account-number">Número de Cuenta (20 dígitos)</Label>
                                        <Input id="account-number" placeholder="0102..." value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} maxLength={20} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile-id">Cédula</Label>
                                        <Input id="mobile-id" value={currentUser.idNumber} readOnly disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile-bank-name">Entidad Bancaria</Label>
                                        <Select onValueChange={setBankName} value={bankName}>
                                            <SelectTrigger id="mobile-bank-name">
                                                <SelectValue placeholder="Selecciona un banco" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile-phone">Número de Teléfono</Label>
                                        <Input id="mobile-phone" placeholder="0412..." value={mobilePaymentPhone} onChange={(e) => setMobilePaymentPhone(e.target.value)} />
                                    </div>
                                </div>
                            )}

                             {accountVerificationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error de Verificación</AlertTitle>
                                    <AlertDescription>
                                        {accountVerificationError} La cuenta puede ser modificada para cambiar de banco, pero siempre debe pertenecer al usuario.
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
                                        Verificando y Guardando...
                                    </>
                                ) : (
                                    "Verificar y Guardar"
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
