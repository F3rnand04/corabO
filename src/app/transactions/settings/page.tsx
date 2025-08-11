
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, AlertTriangle, UserCheck, ShieldCheck, Loader2, Upload, Sparkles, XCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
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
                    <h1 className="text-lg font-semibold">Activación de Registro</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

export default function TransactionsSettingsPage() {
    const { currentUser, activateTransactions, autoVerifyIdWithAI } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
    const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationOutput | { error: string } | null>(null);


    const [paymentDetails, setPaymentDetails] = useState({
        account: { active: true, bankName: '', accountNumber: '' },
        mobile: { active: true, bankName: '', mobilePaymentPhone: '' },
        crypto: { active: false, binanceEmail: '', validated: false }
    });

    if (!currentUser) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    }

    const handleIdFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdDocumentFile(file);
            setVerificationResult(null); // Reset previous results
            const reader = new FileReader();
            reader.onloadend = () => setIdDocumentPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmitVerification = async () => {
        if (!idDocumentFile || !idDocumentPreview) {
            toast({ variant: 'destructive', title: 'Falta Documento', description: 'Por favor, sube una imagen de tu documento de identidad.' });
            return;
        }
        setIsVerifying(true);
        setVerificationResult(null);
        try {
             const result = await autoVerifyIdWithAI({
                userId: currentUser.id,
                nameInRecord: `${currentUser.name} ${currentUser.lastName}`,
                idInRecord: currentUser.idNumber || '',
                documentImageUrl: idDocumentPreview,
            });

            setVerificationResult(result);

            if (result.nameMatch && result.idMatch) {
                toast({
                    title: "¡Verificación Exitosa!",
                    description: "Tus datos coinciden. Por favor, continúa con el siguiente paso.",
                    className: "bg-green-100 border-green-300 text-green-800",
                });
                setStep(2);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Verificación Fallida",
                    description: "Los datos del documento no coinciden con tu registro. Por favor, sube una imagen clara o contacta a soporte."
                });
            }

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error de Verificación', description: 'No se pudo completar la verificación por IA. Inténtalo de nuevo.' });
            setVerificationResult({ error: 'Fallo al ejecutar la verificación por IA.' });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleActivateModule = () => {
        const activeMethods = Object.values(paymentDetails).filter(p => p.active);
        if(activeMethods.length === 0) {
            toast({ variant: 'destructive', title: 'Falta Método de Pago', description: 'Debes configurar al menos un método de pago.' });
            return;
        }
        activateTransactions(currentUser.id, paymentDetails);
        toast({ title: "¡Módulo Activado!", description: "Ahora puedes realizar y recibir pagos de forma segura." });
        router.push('/transactions');
    };

    const renderStepContent = () => {
        switch(step) {
            case 1: // Identity Verification
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5"/> Paso 1: Verificación de Identidad</CardTitle>
                            <CardDescription>Para la seguridad de todos, necesitamos verificar tu identidad. Sube una foto clara de tu cédula.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="id-upload">Documento de Identidad (Cédula)</Label>
                                {idDocumentPreview ? (
                                    <div className="relative w-full aspect-video border rounded-md overflow-hidden">
                                        <Image src={idDocumentPreview} alt="Vista previa de ID" layout="fill" objectFit="contain" />
                                    </div>
                                ) : (
                                    <Label htmlFor="id-upload" className="w-full aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <span className="mt-2 text-sm text-muted-foreground">Haz clic para subir imagen</span>
                                    </Label>
                                )}
                                <Input id="id-upload" type="file" className="hidden" accept="image/*" onChange={handleIdFileChange} />
                            </div>
                             {verificationResult && !('error' in verificationResult) && (
                                <div className="p-3 rounded-md border text-sm space-y-1">
                                    <h5 className="font-semibold mb-2">Resultado de la Verificación IA:</h5>
                                    <p className={verificationResult.nameMatch ? "text-green-600 flex items-center gap-2" : "text-destructive flex items-center gap-2"}>
                                        {verificationResult.nameMatch ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
                                        Coincidencia de Nombre {verificationResult.nameMatch ? "" : `(IA leyó: "${verificationResult.extractedName}")`}
                                    </p>
                                     <p className={verificationResult.idMatch ? "text-green-600 flex items-center gap-2" : "text-destructive flex items-center gap-2"}>
                                        {verificationResult.idMatch ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
                                        Coincidencia de Cédula {verificationResult.idMatch ? "" : `(IA leyó: "${verificationResult.extractedId}")`}
                                    </p>
                                </div>
                            )}
                             <Button className="w-full" onClick={handleSubmitVerification} disabled={!idDocumentFile || isVerifying}>
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                {isVerifying ? 'Verificando con IA...' : 'Verificar Documento con IA'}
                             </Button>
                        </CardContent>
                    </Card>
                );
            case 2: // Payment Setup
                return (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5"/> Paso 2: Registro de Pagos</CardTitle>
                            <CardDescription>Configura los métodos por los cuales recibirás pagos. Puedes activar varios.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Bank Account */}
                            <div className="space-y-2 border p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="account-active" className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4"/> Cuenta Bancaria</Label>
                                    <Checkbox id="account-active" checked={paymentDetails.account.active} onCheckedChange={(c) => setPaymentDetails(p => ({...p, account: {...p.account, active: !!c}}))} />
                                </div>
                                {paymentDetails.account.active && <div className="space-y-2 pt-2">
                                    <Input placeholder="Nombre del Banco" value={paymentDetails.account.bankName} onChange={e => setPaymentDetails(p => ({...p, account: {...p.account, bankName: e.target.value}}))} />
                                    <Input placeholder="Número de Cuenta (20 dígitos)" value={paymentDetails.account.accountNumber} onChange={e => setPaymentDetails(p => ({...p, account: {...p.account, accountNumber: e.target.value}}))} />
                                </div>}
                            </div>
                             {/* Mobile Payment */}
                            <div className="space-y-2 border p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="mobile-active" className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4"/> Pago Móvil</Label>
                                    <Checkbox id="mobile-active" checked={paymentDetails.mobile.active} onCheckedChange={(c) => setPaymentDetails(p => ({...p, mobile: {...p.mobile, active: !!c}}))} />
                                </div>
                                {paymentDetails.mobile.active && <div className="space-y-2 pt-2">
                                    <Input placeholder="Banco" value={paymentDetails.mobile.bankName} onChange={e => setPaymentDetails(p => ({...p, mobile: {...p.mobile, bankName: e.target.value}}))} />
                                    <Input placeholder="Teléfono" value={paymentDetails.mobile.mobilePaymentPhone} onChange={e => setPaymentDetails(p => ({...p, mobile: {...p.mobile, mobilePaymentPhone: e.target.value}}))} />
                                </div>}
                            </div>
                             {/* Crypto */}
                            <div className="space-y-2 border p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="crypto-active" className="font-semibold flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.714 6.556H14.15l2.031 2.031-2.03 2.032h2.563l2.032-2.031-2.03-2.032Zm-4.582 4.583H9.57l2.032 2.03-2.031 2.031h2.562l2.032-2.03-2.032-2.032Zm-4.582 0H5.087l2.032 2.03-2.032 2.031H7.55l2.032-2.03-2.032-2.032Zm9.164-2.551h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03Zm-4.582-4.582H9.57l2.032 2.03-2.031 2.032h2.562l2.032-2.03-2.032-2.031Zm4.582 9.164h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03ZM9.62 2.01l-7.61 7.61 2.032 2.031 7.61-7.61L9.62 2.01Zm0 17.98l-7.61-7.61 2.032-2.032 7.61 7.61-2.032 2.032Z" fill="#F0B90B"></path></svg> Binance Pay</Label>
                                    <Checkbox id="crypto-active" checked={paymentDetails.crypto.active} onCheckedChange={(c) => setPaymentDetails(p => ({...p, crypto: {...p.crypto, active: !!c}}))} />
                                </div>
                                {paymentDetails.crypto.active && <div className="space-y-2 pt-2">
                                     <Input placeholder="Correo asociado a Binance Pay" value={paymentDetails.crypto.binanceEmail} onChange={e => setPaymentDetails(p => ({...p, crypto: {...p.crypto, binanceEmail: e.target.value}}))} />
                                </div>}
                            </div>
                            <Button className="w-full" onClick={handleActivateModule}>
                                <ShieldCheck className="mr-2 h-4 w-4"/>
                                Guardar Métodos y Activar Módulo
                            </Button>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    }


    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
               {currentUser.isTransactionsActive ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>Módulo de Transacciones Activo</CardTitle>
                        <CardDescription>Ya puedes realizar y recibir pagos de forma segura en Corabo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Si necesitas desactivar tu registro o cambiar tus métodos de pago, contacta a soporte.</p>
                        <Button className="w-full mt-4" onClick={() => router.push('/transactions')}>Ir a mi Registro</Button>
                    </CardContent>
                 </Card>
               ) : (
                <>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>¡Atención!</AlertTitle>
                        <AlertDescription>
                            Para poder recibir pagos y gestionar tus ingresos de forma segura, debes completar los siguientes pasos.
                        </AlertDescription>
                    </Alert>
                    {renderStepContent()}
                </>
               )}
            </main>
        </>
    );
}

    