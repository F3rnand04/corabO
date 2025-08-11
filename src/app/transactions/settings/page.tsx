
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, ShieldCheck, FileText, AlertTriangle, User, KeyRound, Link as LinkIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

function SettingsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold">Ajustes del Registro</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

function PaymentMethodCard({
  icon,
  title,
  children,
  isActive,
  onToggle
}: {
  icon: React.ElementType,
  title: string,
  children: React.ReactNode,
  isActive: boolean,
  onToggle: (checked: boolean) => void
}) {
    const Icon = icon;
    return (
        <div className="border p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2"><Icon className="w-5 h-5"/>{title}</h4>
                <Switch checked={isActive} onCheckedChange={onToggle} />
            </div>
            {isActive && <div className="space-y-2 pt-2 border-t">{children}</div>}
        </div>
    )
}

export default function TransactionsSettingsPage() {
    const { currentUser, deactivateTransactions } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [paymentDetails, setPaymentDetails] = useState({
        account: {
            active: currentUser?.profileSetupData?.paymentDetails?.account?.active ?? true,
            bankName: currentUser?.profileSetupData?.paymentDetails?.account?.bankName ?? 'Banco de Venezuela',
            accountNumber: currentUser?.profileSetupData?.paymentDetails?.account?.accountNumber ?? '01020544160000005424'
        },
        mobile: {
            active: currentUser?.profileSetupData?.paymentDetails?.mobile?.active ?? true,
            bankName: currentUser?.profileSetupData?.paymentDetails?.mobile?.bankName ?? 'Banco de Venezuela',
            mobilePaymentPhone: currentUser?.profileSetupData?.paymentDetails?.mobile?.mobilePaymentPhone ?? '04128978405'
        },
        crypto: {
            active: currentUser?.profileSetupData?.paymentDetails?.crypto?.active ?? false,
            binanceEmail: currentUser?.profileSetupData?.paymentDetails?.crypto?.binanceEmail ?? currentUser?.email ?? ''
        }
    });

    if (!currentUser) {
        // AppLayout should handle redirection, but this is a safeguard
        return null;
    }

    if (!currentUser.isTransactionsActive) {
        // If the module is not active, redirect to the activation flow
        router.replace('/transactions/activate');
        return null;
    }
    
    const handleToggle = (method: 'account' | 'mobile' | 'crypto', active: boolean) => {
        setPaymentDetails(prev => ({ ...prev, [method]: { ...prev[method], active } }));
    };
    
    const handleValueChange = (method: 'account' | 'mobile' | 'crypto', field: string, value: string) => {
        setPaymentDetails(prev => ({
            ...prev,
            [method]: { ...prev[method], [field]: value }
        }));
    };
    
    const handleSaveChanges = () => {
        // Here you would call a function from your context to save the changes
        // For now, we just show a toast
        toast({ title: "Cambios Guardados", description: "Tus métodos de pago han sido actualizados." });
    }

    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Métodos de Pago</CardTitle>
                        <CardDescription>
                            Gestiona cómo recibirás los pagos. Los métodos activos serán visibles para tus clientes al momento de pagarte.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <PaymentMethodCard
                            icon={Banknote}
                            title="Cuenta Bancaria"
                            isActive={paymentDetails.account.active}
                            onToggle={(checked) => handleToggle('account', checked)}
                        >
                            <div className="space-y-1">
                                <Label>Titular</Label>
                                <Input value={`${currentUser.name} ${currentUser.lastName || ''}`} disabled />
                            </div>
                            <div className="space-y-1">
                                <Label>Banco</Label>
                                <Input value={paymentDetails.account.bankName} onChange={(e) => handleValueChange('account', 'bankName', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>Número de Cuenta</Label>
                                <Input value={paymentDetails.account.accountNumber} onChange={(e) => handleValueChange('account', 'accountNumber', e.target.value)} />
                            </div>
                        </PaymentMethodCard>

                        <PaymentMethodCard
                            icon={Smartphone}
                            title="Pago Móvil"
                            isActive={paymentDetails.mobile.active}
                            onToggle={(checked) => handleToggle('mobile', checked)}
                        >
                            <div className="space-y-1">
                                <Label>Cédula</Label>
                                <Input value={currentUser.idNumber} disabled />
                            </div>
                            <div className="space-y-1">
                                <Label>Teléfono</Label>
                                <Input value={paymentDetails.mobile.mobilePaymentPhone} onChange={(e) => handleValueChange('mobile', 'mobilePaymentPhone', e.target.value)} />
                            </div>
                             <div className="space-y-1">
                                <Label>Banco</Label>
                                <Input value={paymentDetails.mobile.bankName} onChange={(e) => handleValueChange('mobile', 'bankName', e.target.value)} />
                            </div>
                        </PaymentMethodCard>

                         <PaymentMethodCard
                            icon={KeyRound}
                            title="Binance (Pay ID)"
                            isActive={paymentDetails.crypto.active}
                            onToggle={(checked) => handleToggle('crypto', checked)}
                        >
                            <div className="space-y-1">
                                <Label>Correo / Pay ID</Label>
                                <Input value={paymentDetails.crypto.binanceEmail} onChange={(e) => handleValueChange('crypto', 'binanceEmail', e.target.value)} />
                            </div>
                        </PaymentMethodCard>

                        <Button className="w-full" onClick={handleSaveChanges}>
                            <ShieldCheck className="mr-2 h-4 w-4"/> Guardar Cambios
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <FileText className="w-5 h-5"/>
                           Políticas y Documentación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/policies">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                Ver Políticas del Registro de Transacciones
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                 <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                           <AlertTriangle className="w-5 h-5"/>
                           Zona de Peligro
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Desactivar Registro de Transacciones
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Al desactivar el registro, no podrás recibir pagos ni gestionar transacciones a través de Corabo.
                                        Tu cuenta no será eliminada, pero esta funcionalidad quedará inactiva hasta que la vuelvas a configurar.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deactivateTransactions(currentUser.id)}>Sí, desactivar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
