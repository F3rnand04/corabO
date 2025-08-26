

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, AlertCircle, Home, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import type { ProfileSetupData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription as AlertDialogAlertDescription } from "@/components/ui/alert";
import { venezuelanBanks } from "@/lib/data/options";
import Link from 'next/link';
import { updateUser } from '@/lib/actions/user.actions';

function PaymentMethodsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><Banknote className="w-5 h-5"/> Métodos de Pago</h1>
                     <Button asChild variant="ghost" size="icon">
                        <Link href="/">
                            <Home className="h-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

export default function PaymentMethodsPage() {
    const { currentUser } = useCorabo();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // Local state for form data, initialized from context
    const [paymentDetails, setPaymentDetails] = useState<ProfileSetupData['paymentDetails']>(
        currentUser?.profileSetupData?.paymentDetails || {
            account: { active: false, bankName: '', accountNumber: '' },
            mobile: { active: false, bankName: '', mobilePaymentPhone: '' },
            crypto: { active: false, binanceEmail: '', validated: false }
        }
    );

    useEffect(() => {
        if (currentUser?.profileSetupData?.paymentDetails) {
            setPaymentDetails(currentUser.profileSetupData.paymentDetails);
        }
    }, [currentUser]);

    const handleToggle = (method: 'account' | 'mobile' | 'crypto') => {
        setPaymentDetails(prev => ({
            ...prev,
            [method]: { ...prev?.[method], active: !prev?.[method]?.active }
        }));
    };

    const handleInputChange = (method: 'account' | 'mobile' | 'crypto', field: string, value: string) => {
        setPaymentDetails(prev => ({
            ...prev,
            [method]: { ...prev?.[method], [field]: value }
        }));
    };

    const handleSaveChanges = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        try {
            await updateUser(currentUser.id, { 
                'profileSetupData.paymentDetails': paymentDetails 
            });
            toast({ title: 'Éxito', description: 'Tus métodos de pago han sido actualizados.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!currentUser) return null;

    return (
        <div className="bg-muted/30 min-h-screen">
            <PaymentMethodsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Información Importante</AlertTitle>
                    <AlertDialogAlertDescription>
                        Asegúrate de que los datos de pago que registres coincidan <strong>exactamente</strong> con los del titular de la cuenta Corabo ({currentUser.name}) para evitar problemas con la validación de transacciones.
                    </AlertDialogAlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5"/> Pago Móvil</CardTitle>
                            <Switch checked={paymentDetails?.mobile?.active} onCheckedChange={() => handleToggle('mobile')} />
                        </div>
                        <CardDescription>Recibe pagos directamente a tu número de teléfono.</CardDescription>
                    </CardHeader>
                    {paymentDetails?.mobile?.active && (
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobile-phone">Teléfono Afiliado</Label>
                                <Input id="mobile-phone" placeholder="04121234567" value={paymentDetails.mobile.mobilePaymentPhone} onChange={(e) => handleInputChange('mobile', 'mobilePaymentPhone', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mobile-bank">Banco</Label>
                                <Select value={paymentDetails.mobile.bankName} onValueChange={(value) => handleInputChange('mobile', 'bankName', value)}>
                                    <SelectTrigger id="mobile-bank"><SelectValue placeholder="Selecciona un banco" /></SelectTrigger>
                                    <SelectContent>
                                        {venezuelanBanks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    )}
                </Card>
                
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5"/> Cuenta Bancaria</CardTitle>
                             <Switch checked={paymentDetails?.account?.active} onCheckedChange={() => handleToggle('account')} />
                        </div>
                        <CardDescription>Para transferencias directas a tu cuenta.</CardDescription>
                    </CardHeader>
                    {paymentDetails?.account?.active && (
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="account-number">Número de Cuenta (20 dígitos)</Label>
                                <Input id="account-number" placeholder="0102..." value={paymentDetails.account.accountNumber} onChange={(e) => handleInputChange('account', 'accountNumber', e.target.value)} maxLength={20}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="account-bank">Banco</Label>
                                 <Select value={paymentDetails.account.bankName} onValueChange={(value) => handleInputChange('account', 'bankName', value)}>
                                    <SelectTrigger id="account-bank"><SelectValue placeholder="Selecciona un banco" /></SelectTrigger>
                                    <SelectContent>
                                        {venezuelanBanks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    )}
                </Card>

                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">Binance Pay</CardTitle>
                             <Switch checked={paymentDetails?.crypto?.active} onCheckedChange={() => handleToggle('crypto')} />
                        </div>
                         <CardDescription>Recibe pagos en criptomonedas (USDT) a través de Binance.</CardDescription>
                    </CardHeader>
                     {paymentDetails?.crypto?.active && (
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="binance-email">Pay ID o Email de Binance</Label>
                                <Input id="binance-email" placeholder="tu-usuario@binance.com" value={paymentDetails.crypto.binanceEmail} onChange={(e) => handleInputChange('crypto', 'binanceEmail', e.target.value)} />
                            </div>
                             {paymentDetails.crypto.validated && (
                                <p className="text-sm text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Verificado</p>
                             )}
                        </CardContent>
                    )}
                </Card>

                <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </main>
        </div>
    );
}
