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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationItem } from '@/components/ValidationItem';
import { venezuelanBanks } from '@/lib/data/options';
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
            {isActive && <div className="space-y-4 pt-4 border-t">{children}</div>}
        </div>
    )
}

export default function TransactionsSettingsPage() {
    const { currentUser, deactivateTransactions, updateUser, validateEmail, sendPhoneVerification, verifyPhoneCode, sendMessage, activateTransactions } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [paymentDetails, setPaymentDetails] = useState(() => {
        const pd = currentUser?.profileSetupData?.paymentDetails;
        return {
            account: {
                active: pd?.account?.active ?? true,
                bankName: pd?.account?.bankName ?? '',
                accountNumber: pd?.account?.accountNumber ?? ''
            },
            mobile: {
                active: pd?.mobile?.active ?? true,
                bankName: pd?.mobile?.bankName ?? '',
                mobilePaymentPhone: pd?.mobile?.mobilePaymentPhone ?? currentUser?.phone ?? ''
            },
            crypto: {
                active: pd?.crypto?.active ?? false,
                binanceEmail: pd?.crypto?.binanceEmail ?? currentUser?.email ?? '',
                validated: pd?.crypto?.validated ?? false,
            }
        };
    });

    if (!currentUser) {
        return null;
    }

    const isCompany = currentUser.profileSetupData?.providerType === 'company';

    const handleToggle = (method: 'account' | 'mobile' | 'crypto', active: boolean) => {
        setPaymentDetails(prev => ({ ...prev, [method]: { ...prev[method], active } }));
    };
    
    const handleValueChange = (method: 'account' | 'mobile' | 'crypto', field: string, value: string) => {
        setPaymentDetails(prev => ({
            ...prev,
            [method]: { ...prev[method], [field]: value }
        }));
    };
    
    const handleSaveChanges = async () => {
        if (!currentUser) return;
        const wasActive = currentUser.isTransactionsActive;
        
        await activateTransactions(currentUser.id, paymentDetails);

        toast({ 
            title: wasActive ? "Cambios Guardados" : "¡Registro Activado!",
            description: wasActive 
                ? "Tus métodos de pago han sido actualizados." 
                : "Ahora puedes recibir pagos y gestionar transacciones."
        });
        
        if (!wasActive) {
            router.push('/transactions');
        }
    }

    const handleContactSupportForEmailChange = () => {
        const supportMessage = "Hola, necesito ayuda para cambiar el correo electrónico asociado a mi Binance Pay ID.";
        const conversationId = sendMessage({recipientId: 'corabo-admin', text: supportMessage});
        router.push(`/messages/${conversationId}`);
    };

    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                 {!currentUser.isTransactionsActive && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Registro de Transacciones Inactivo</AlertTitle>
                        <AlertDescription>
                            Para empezar a recibir pagos, configura al menos un método de pago y guarda los cambios para activar tu registro.
                        </AlertDescription>
                    </Alert>
                )}
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
                                <Input value={isCompany ? currentUser.name : `${currentUser.name} ${currentUser.lastName || ''}`} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Banco</Label>
                                <Select
                                  value={paymentDetails.account.bankName}
                                  onValueChange={(value) => handleValueChange('account', 'bankName', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un banco" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {venezuelanBanks.map(bank => (
                                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                <Label>ID/Documento</Label>
                                <Input value={currentUser.idNumber} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Banco</Label>
                                <Select
                                  value={paymentDetails.mobile.bankName}
                                  onValueChange={(value) => handleValueChange('mobile', 'bankName', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un banco" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {venezuelanBanks.map(bank => (
                                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                             <ValidationItem
                                label="Teléfono:"
                                value={currentUser.phone}
                                initialStatus={currentUser.phoneValidated ? 'validated' : 'idle'}
                                onValidate={() => sendPhoneVerification(currentUser.id, currentUser.phone)}
                                onValueChange={(value) => updateUser(currentUser.id, { phone: value })}
                                type="phone"
                            />
                        </PaymentMethodCard>

                         <PaymentMethodCard
                            icon={KeyRound}
                            title="Binance (Pay ID)"
                            isActive={paymentDetails.crypto.active}
                            onToggle={(checked) => handleToggle('crypto', checked)}
                        >
                             <div className="space-y-1">
                                <Label>Correo Asociado</Label>
                                <div className="text-sm p-2 bg-muted rounded-md flex justify-between items-center">
                                    <span className="font-mono">{currentUser.email}</span>
                                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleContactSupportForEmailChange}>Cambiar</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Por seguridad, tu Pay ID está vinculado a tu correo de registro.</p>
                             </div>
                        </PaymentMethodCard>

                        <Button className="w-full" onClick={handleSaveChanges}>
                            <ShieldCheck className="mr-2 h-4 w-4"/>
                            {currentUser.isTransactionsActive ? 'Guardar Cambios' : 'Guardar y Activar Registro'}
                        </Button>
                    </CardContent>
                </Card>
                
            </main>
        </>
    );
}
