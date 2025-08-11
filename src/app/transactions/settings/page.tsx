
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, Smartphone, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

function PaymentMethodEditor({
    method,
    details,
    onSave,
}: {
    method: 'account' | 'mobile' | 'crypto';
    details: any;
    onSave: (method: 'account' | 'mobile' | 'crypto', newDetails: any) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editableDetails, setEditableDetails] = useState(details);

    const handleSave = () => {
        onSave(method, editableDetails);
        setIsEditing(false);
    };

    const icons = {
        account: <Banknote className="w-5 h-5" />,
        mobile: <Smartphone className="w-5 h-5" />,
        crypto: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.714 6.556H14.15l2.031 2.031-2.03 2.032h2.563l2.032-2.031-2.03-2.032Zm-4.582 4.583H9.57l2.032 2.03-2.031 2.031h2.562l2.032-2.03-2.032-2.032Zm-4.582 0H5.087l2.032 2.03-2.032 2.031H7.55l2.032-2.03-2.032-2.032Zm9.164-2.551h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03Zm-4.582-4.582H9.57l2.032 2.03-2.031 2.032h2.562l2.032-2.03-2.032-2.031Zm4.582 9.164h2.563l-2.032 2.031 2.032 2.03h-2.563l-2.031-2.031 2.031-2.03ZM9.62 2.01l-7.61 7.61 2.032 2.031 7.61-7.61L9.62 2.01Zm0 17.98l-7.61-7.61 2.032-2.032 7.61 7.61-2.032 2.032Z" fill="#F0B90B"></path></svg>
    };

    const titles = { account: 'Cuenta Bancaria', mobile: 'Pago Móvil', crypto: 'Binance Pay' };
    const fieldsToEdit = {
        account: { label: 'Número de Cuenta', field: 'accountNumber' },
        mobile: { label: 'Número de Teléfono', field: 'mobilePaymentPhone' },
        crypto: { label: 'Correo de Binance', field: 'binanceEmail' },
    };

    return (
        <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-medium">{icons[method]} {titles[method]}</h4>
                {!isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>}
            </div>
            {isEditing ? (
                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor={`${method}-field`}>{fieldsToEdit[method].label}</Label>
                        <Input
                            id={`${method}-field`}
                            value={editableDetails[fieldsToEdit[method].field]}
                            onChange={(e) => setEditableDetails({ ...editableDetails, [fieldsToEdit[method].field]: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditableDetails(details); }}>Cancelar</Button>
                        <Button size="sm" onClick={handleSave}>Guardar</Button>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    <p><strong>{details.bankName || 'Binance'}</strong></p>
                    <p className="font-mono">{details.accountNumber || details.mobilePaymentPhone || details.binanceEmail}</p>
                </div>
            )}
        </div>
    );
}

export default function TransactionsSettingsPage() {
    const { currentUser, updateUser, deactivateTransactions } = useCorabo();
    const { toast } = useToast();
    const router = useRouter();

    if (!currentUser) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    }

    const handleSaveChanges = async (method: 'account' | 'mobile' | 'crypto', newDetails: any) => {
        if (!currentUser.profileSetupData?.paymentDetails) return;

        const updatedPaymentDetails = {
            ...currentUser.profileSetupData.paymentDetails,
            [method]: newDetails,
        };

        await updateUser(currentUser.id, {
            profileSetupData: {
                ...currentUser.profileSetupData,
                paymentDetails: updatedPaymentDetails,
            },
        });

        toast({ title: "Método de Pago Actualizado", description: "Tus cambios han sido guardados." });
    };

    const paymentDetails = currentUser.profileSetupData?.paymentDetails;

    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Métodos de Pago Registrados</CardTitle>
                        <CardDescription>
                            Aquí puedes ver y actualizar la información donde recibirás tus pagos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {paymentDetails?.account?.active && (
                            <PaymentMethodEditor method="account" details={paymentDetails.account} onSave={handleSaveChanges} />
                        )}
                        {paymentDetails?.mobile?.active && (
                            <PaymentMethodEditor method="mobile" details={paymentDetails.mobile} onSave={handleSaveChanges} />
                        )}
                        {paymentDetails?.crypto?.active && (
                            <PaymentMethodEditor method="crypto" details={paymentDetails.crypto} onSave={handleSaveChanges} />
                        )}
                        {!paymentDetails?.account?.active && !paymentDetails?.mobile?.active && !paymentDetails?.crypto?.active && (
                            <p className="text-sm text-muted-foreground text-center py-4">No tienes métodos de pago activos.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Políticas y Términos</CardTitle>
                        <CardDescription>
                            Revisa las políticas que rigen el uso del registro de transacciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" asChild>
                            <a href="/policies" target="_blank">Ver Políticas de Servicio y Privacidad</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Zona de Peligro</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">Desactivar Registro de Transacciones</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro que quieres desactivar el registro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción es reversible, pero mientras esté desactivado, no podrás realizar ni recibir pagos a través de la plataforma, y tus clientes no podrán contratarte.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => {
                                            deactivateTransactions(currentUser.id);
                                            router.push('/transactions');
                                        }}
                                    >
                                        Sí, desactivar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
