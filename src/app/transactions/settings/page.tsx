
'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, ShieldCheck, FileText, AlertTriangle, User, KeyRound, Link as LinkIcon, Trash2, Box, QrCode } from "lucide-react";
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
import { QRCodeSVG } from 'qrcode.react';

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

function CashierManagementCard() {
    const { currentUser, addCashierBox, removeCashierBox } = useCorabo();
    const [newBoxName, setNewBoxName] = useState('');
    const [newBoxPassword, setNewBoxPassword] = useState('');
    const [selectedBoxQr, setSelectedBoxQr] = useState<{name: string, value: string} | null>(null);
    
    const handleAddBox = () => {
        if (newBoxName && newBoxPassword) {
            addCashierBox(newBoxName, newBoxPassword);
            setNewBoxName('');
            setNewBoxPassword('');
        }
    };

    const downloadQR = () => {
        if (!selectedBoxQr) return;
        const svg = document.getElementById('qr-code-svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR-Caja-${selectedBoxQr.name.replace(/\s+/g, '-')}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };
    
    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary"/>Gestión de Cajas</CardTitle>
                <CardDescription>Crea y gestiona los puntos de venta para tu negocio. Cada caja tendrá su propio QR de pago.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2 p-3 border rounded-lg bg-background">
                    <h4 className="text-sm font-semibold">Añadir Nueva Caja</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input placeholder="Nombre de la caja (ej: Barra)" value={newBoxName} onChange={(e) => setNewBoxName(e.target.value)} />
                        <Input type="password" placeholder="Contraseña numérica (4-6 dígitos)" value={newBoxPassword} onChange={(e) => setNewBoxPassword(e.target.value)} maxLength={6} />
                        <Button onClick={handleAddBox} disabled={!newBoxName || !newBoxPassword || (currentUser?.profileSetupData?.cashierBoxes?.length || 0) >= 5}>Añadir</Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Cajas Activas</h4>
                    {currentUser?.profileSetupData?.cashierBoxes && currentUser.profileSetupData.cashierBoxes.length > 0 ? (
                        <div className="space-y-2">
                            {currentUser.profileSetupData.cashierBoxes.map(box => (
                                <div key={box.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                    <p className="font-medium">{box.name}</p>
                                    <div className="flex items-center gap-1">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedBoxQr({name: box.name, value: box.qrValue})}>
                                                    <QrCode className="w-4 h-4 mr-2"/>Ver QR
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                {selectedBoxQr && (
                                                    <>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>QR para {selectedBoxQr.name}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Descarga y imprime este QR para que tus clientes puedan escanearlo y pagar.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="py-4 flex items-center justify-center">
                                                        <div className="p-4 bg-white rounded-lg">
                                                            <QRCodeSVG id="qr-code-svg" value={selectedBoxQr.value} size={256} />
                                                        </div>
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={downloadQR}>Descargar PNG</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                    </>
                                                )}
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar la caja "{box.name}"?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción es permanente y no se puede deshacer.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removeCashierBox(box.id)}>Sí, eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">Aún no has creado ninguna caja.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function TransactionsSettingsPage() {
    const { currentUser, deactivateTransactions, updateUser, validateEmail, sendPhoneVerification, verifyPhoneCode, sendMessage, activateTransactions } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    const [paymentDetails, setPaymentDetails] = useState(() => {
        const pd = currentUser?.profileSetupData?.paymentDetails;
        // **FIX**: Initialize with a default structure if 'pd' is undefined
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
        
        router.push('/transactions');
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

                {isCompany && <CashierManagementCard />}

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
                
                {currentUser.isTransactionsActive && (
                    <>
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
                    </>
                )}
            </main>
        </>
    );
}
