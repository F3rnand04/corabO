
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, AlertTriangle, FileText, Upload, UserCheck, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

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
    const { currentUser, activateTransactions, setIdVerificationPending } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
    const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const reader = new FileReader();
            reader.onloadend = () => setIdDocumentPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmitVerification = async () => {
        if (!idDocumentFile) {
            toast({ variant: 'destructive', title: 'Falta Documento', description: 'Por favor, sube una imagen de tu documento de identidad.' });
            return;
        }
        setIsSubmitting(true);
        // Simulating upload and getting a URL
        const simulatedUrl = `https://i.postimg.cc/L8y2zWc2/vzla-id.png`; 
        try {
            await setIdVerificationPending(currentUser.id, simulatedUrl);
            toast({ title: 'Documento Enviado', description: 'Tu documento está siendo revisado. Te notificaremos cuando se apruebe.' });
            setStep(2);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el documento.' });
        } finally {
            setIsSubmitting(false);
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
                             <Button className="w-full" onClick={handleSubmitVerification} disabled={!idDocumentFile || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Enviar y Verificar Documento
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
