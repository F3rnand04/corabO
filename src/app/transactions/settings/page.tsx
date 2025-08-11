
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

const venezuelanBanks = [
    "Banco de Venezuela",
    "Banesco",
    "Banco Mercantil",
    "Banco Provincial",
    "BOD",
    "BNC",
    "Banco del Tesoro",
    "Bicentenario Banco Universal",
    "Banplus",
    "Bancaribe",
    "Banco Sofitasa",
    "Banco Plaza",
    "100% Banco",
    "Mi Banco",
    "Bancrecer",
    "Otros"
];

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
    const { currentUser, deactivateTransactions, updateUser, validateEmail, sendPhoneVerification, verifyPhoneCode } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [paymentDetails, setPaymentDetails] = useState({
        account: {
            active: currentUser?.profileSetupData?.paymentDetails?.account?.active ?? true,
            bankName: currentUser?.profileSetupData?.paymentDetails?.account?.bankName ?? '',
            accountNumber: currentUser?.profileSetupData?.paymentDetails?.account?.accountNumber ?? ''
        },
        mobile: {
            active: currentUser?.profileSetupData?.paymentDetails?.mobile?.active ?? true,
            bankName: currentUser?.profileSetupData?.paymentDetails?.mobile?.bankName ?? '',
            mobilePaymentPhone: currentUser?.profileSetupData?.paymentDetails?.mobile?.mobilePaymentPhone ?? currentUser?.phone ?? ''
        },
        crypto: {
            active: currentUser?.profileSetupData?.paymentDetails?.crypto?.active ?? false,
            binanceEmail: currentUser?.profileSetupData?.paymentDetails?.crypto?.binanceEmail ?? currentUser?.email ?? ''
        }
    });

    if (!currentUser) {
        return null;
    }

    if (!currentUser.isTransactionsActive) {
      // This will redirect to the activation flow if the user is not yet active.
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
        const updatedProfileData = {
            ...currentUser.profileSetupData,
            paymentDetails: {
                ...currentUser.profileSetupData?.paymentDetails,
                ...paymentDetails,
            }
        };
        updateUser(currentUser.id, { profileSetupData: updatedProfileData });
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
                                <Label>Cédula</Label>
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

                         <div className="border p-4 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5"/>Binance (Pay ID)</h4>
                                <Switch checked={paymentDetails.crypto.active} onCheckedChange={(checked) => handleToggle('crypto', checked)} />
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-1">
                                    <Label>Correo / Pay ID</Label>
                                    <Input 
                                      value={paymentDetails.crypto.binanceEmail} 
                                      onChange={(e) => handleValueChange('crypto', 'binanceEmail', e.target.value)} 
                                      disabled={!paymentDetails.crypto.active}
                                    />
                                </div>
                            </div>
                        </div>

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
