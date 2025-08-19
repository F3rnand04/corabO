
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, KeyRound, QrCode, Trash2, Eye, EyeOff, RefreshCw, FileText, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { PrintableQrDisplay } from '@/components/PrintableQrDisplay';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


function CashierSettingsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/transactions/settings')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5"/> Gestión de Cajas</h1>
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/">
                            <Home className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

function CashierManagementCard() {
    const { currentUser, addCashierBox, removeCashierBox, updateCashierBox, regenerateCashierBoxQr, qrSession } = useCorabo();
    const [newBoxName, setNewBoxName] = useState('');
    const [newBoxPassword, setNewBoxPassword] = useState('');
    const [selectedBox, setSelectedBox] = useState<{id: string, name: string, businessId: string, qrDataURL: string | undefined} | null>(null);
    const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
    const [editingPasswords, setEditingPasswords] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // To track which box is being processed
    
    const handleAddBox = async () => {
        if (newBoxName && newBoxPassword) {
            setIsProcessing('new');
            await addCashierBox(newBoxName, newBoxPassword);
            setNewBoxName('');
            setNewBoxPassword('');
            setIsProcessing(null);
        }
    };
    
    const handlePasswordChange = (boxId: string, value: string) => {
        setEditingPasswords(prev => ({ ...prev, [boxId]: value }));
    };
    
    const handleUpdatePassword = async (boxId: string) => {
        const newPassword = editingPasswords[boxId];
        if (newPassword) {
            setIsProcessing(boxId);
            await updateCashierBox(boxId, { passwordHash: newPassword });
            setEditingPasswords(prev => {
                const newState = {...prev};
                delete newState[boxId];
                return newState;
            });
            setIsProcessing(null);
        }
    };

    const handleRegenerateQr = async (boxId: string) => {
      setIsProcessing(boxId);
      await regenerateCashierBoxQr(boxId);
      setIsProcessing(null);
    }
    
    const handleRemoveBox = async (boxId: string) => {
       setIsProcessing(boxId);
       await removeCashierBox(boxId);
       setIsProcessing(null);
    }

    const togglePasswordVisibility = (boxId: string) => {
        setPasswordVisibility(prev => ({ ...prev, [boxId]: !prev[boxId] }));
    };
    
    if (!currentUser || currentUser.profileSetupData?.providerType !== 'company') {
        return <p>Esta función solo está disponible para cuentas de empresa.</p>;
    }
    
    const cashierBoxes = currentUser?.profileSetupData?.cashierBoxes || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Administrar Puntos de Venta</CardTitle>
                <CardDescription>Crea y gestiona los puntos de venta para tu negocio. Cada caja tendrá su propio QR de pago y contraseña.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2 p-3 border rounded-lg bg-background">
                    <h4 className="text-sm font-semibold">Añadir Nueva Caja</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input placeholder="Nombre de la caja (ej: Barra)" value={newBoxName} onChange={(e) => setNewBoxName(e.target.value)} disabled={isProcessing === 'new'} />
                        <Input type="text" placeholder="Contraseña numérica (4-6 dígitos)" value={newBoxPassword} onChange={(e) => setNewBoxPassword(e.target.value)} maxLength={6} disabled={isProcessing === 'new'}/>
                        <Button onClick={handleAddBox} disabled={isProcessing === 'new' || !newBoxName || !newBoxPassword || cashierBoxes.length >= 5}>
                            {isProcessing === 'new' ? "Creando..." : "Añadir"}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Cajas Activas</h4>
                    {cashierBoxes.length > 0 ? (
                        <div className="space-y-2">
                            {cashierBoxes.map(box => {
                                const isActive = qrSession?.cashierBoxId === box.id;
                                return (
                                <div key={box.id} className={cn("flex flex-col gap-3 p-3 bg-background rounded-md border", isActive && "border-green-500 ring-1 ring-green-500")}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium flex-shrink-0">{box.name}</p>
                                            {isActive && <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activa</Badge>}
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={isProcessing === box.id}><Trash2 className="w-4 h-4"/></Button>
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
                                                    <AlertDialogAction onClick={() => handleRemoveBox(box.id)}>Sí, eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="flex-grow flex items-center gap-2">
                                        <div className="relative w-full">
                                            <Input
                                                type={passwordVisibility[box.id] ? 'text' : 'password'}
                                                defaultValue={box.passwordHash}
                                                onChange={(e) => handlePasswordChange(box.id, e.target.value)}
                                                className="pr-10"
                                            />
                                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => togglePasswordVisibility(box.id)}>
                                                {passwordVisibility[box.id] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                            </Button>
                                        </div>
                                         <Button size="sm" onClick={() => handleUpdatePassword(box.id)} disabled={!editingPasswords[box.id] || isProcessing === box.id}>Guardar</Button>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end flex-wrap">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/transactions/settings/cashier/${box.id}`}><FileText className="w-4 h-4 mr-2"/>Detalles</Link>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={isProcessing === box.id}>{isProcessing === box.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}{isProcessing !== box.id && "Nuevo QR"}</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Generar nuevo QR para "{box.name}"?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción invalidará el código QR anterior. Asegúrate de reemplazar cualquier QR físico que estés usando.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRegenerateQr(box.id)}>Sí, generar nuevo QR</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <Button variant="outline" size="sm" onClick={() => setSelectedBox({id: box.id, name: box.name, businessId: currentUser.coraboId || currentUser.id, qrDataURL: box.qrDataURL})}>
                                            <QrCode className="w-4 h-4 mr-2"/>Ver QR
                                        </Button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">Aún no has creado ninguna caja.</p>
                    )}
                </div>
            </CardContent>
             <AlertDialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
                <AlertDialogContent className="max-w-md p-0 bg-transparent border-none shadow-none">
                    {selectedBox && (
                        <PrintableQrDisplay 
                            boxName={selectedBox.name}
                            businessId={selectedBox.businessId}
                            qrDataURL={selectedBox.qrDataURL}
                            onClose={() => setSelectedBox(null)}
                        />
                    )}
                </AlertDialogContent>
             </AlertDialog>
        </Card>
    )
}

export default function CashierPage() {
    return (
        <>
            <CashierSettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                <CashierManagementCard />
            </main>
        </>
    );
}
