
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, KeyRound, QrCode, Trash2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';

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
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

function CashierManagementCard() {
    const { currentUser, addCashierBox, removeCashierBox, updateCashierBox } = useCorabo();
    const [newBoxName, setNewBoxName] = useState('');
    const [newBoxPassword, setNewBoxPassword] = useState('');
    const [selectedBoxQr, setSelectedBoxQr] = useState<{name: string, value: string} | null>(null);
    const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
    const [editingPasswords, setEditingPasswords] = useState<Record<string, string>>({});
    
    const handleAddBox = () => {
        if (newBoxName && newBoxPassword) {
            addCashierBox(newBoxName, newBoxPassword);
            setNewBoxName('');
            setNewBoxPassword('');
        }
    };
    
    const handlePasswordChange = (boxId: string, value: string) => {
        setEditingPasswords(prev => ({ ...prev, [boxId]: value }));
    };
    
    const handleUpdatePassword = (boxId: string) => {
        const newPassword = editingPasswords[boxId];
        if (newPassword) {
            updateCashierBox(boxId, { passwordHash: newPassword });
        }
    };

    const togglePasswordVisibility = (boxId: string) => {
        setPasswordVisibility(prev => ({ ...prev, [boxId]: !prev[boxId] }));
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
    
    if (!currentUser || currentUser.profileSetupData?.providerType !== 'company') {
        return <p>Esta función solo está disponible para cuentas de empresa.</p>;
    }
    
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
                        <Input placeholder="Nombre de la caja (ej: Barra)" value={newBoxName} onChange={(e) => setNewBoxName(e.target.value)} />
                        <Input type="text" placeholder="Contraseña numérica (4-6 dígitos)" value={newBoxPassword} onChange={(e) => setNewBoxPassword(e.target.value)} maxLength={6} />
                        <Button onClick={handleAddBox} disabled={!newBoxName || !newBoxPassword || (currentUser?.profileSetupData?.cashierBoxes?.length || 0) >= 5}>Añadir</Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Cajas Activas</h4>
                    {currentUser?.profileSetupData?.cashierBoxes && currentUser.profileSetupData.cashierBoxes.length > 0 ? (
                        <div className="space-y-2">
                            {currentUser.profileSetupData.cashierBoxes.map(box => (
                                <div key={box.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-background rounded-md border">
                                    <p className="font-medium flex-shrink-0">{box.name}</p>
                                    <div className="flex-grow flex items-center gap-2">
                                        <div className="relative w-full">
                                            <Input
                                                type={passwordVisibility[box.id] ? 'text' : 'password'}
                                                value={editingPasswords[box.id] ?? box.passwordHash}
                                                onChange={(e) => handlePasswordChange(box.id, e.target.value)}
                                                className="pr-10"
                                            />
                                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => togglePasswordVisibility(box.id)}>
                                                {passwordVisibility[box.id] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                            </Button>
                                        </div>
                                         <Button size="sm" onClick={() => handleUpdatePassword(box.id)} disabled={!editingPasswords[box.id] || editingPasswords[box.id] === box.passwordHash}>Guardar</Button>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
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
