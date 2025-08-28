
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info, Copy, Loader2, QrCode, UploadCloud, CheckCircle, Smartphone, Banknote, Hourglass, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { QRCodeSVG } from 'qrcode.react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe, doc } from 'firebase/firestore';
import type { QrSession } from '@/lib/types';
import { setQrSessionAmount, cancelQrSession, confirmMobilePayment, finalizeQrSession } from '@/lib/actions/cashier.actions';
import { credicoraLevels } from '@/lib/types';

export default function ShowQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useCorabo();

  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  const [amount, setAmount] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'qr_sessions'), where('providerId', '==', currentUser.id), where('status', '!=', 'completed'), where('status', '!=', 'cancelled'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeSession = snapshot.docs.length > 0 ? snapshot.docs[0].data() as QrSession : null;
        setQrSession(activeSession);
    });

    return () => unsubscribe();
  }, [currentUser]);


  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const qrValue = JSON.stringify({ providerId: currentUser.id });
  const manualCode = currentUser.coraboId || 'N/A';
  
  const handleCopyCode = () => {
    if (manualCode !== 'N/A') {
      navigator.clipboard.writeText(manualCode);
      toast({ title: 'Copiado', description: 'Tu código manual ha sido copiado.' });
    }
  };

  const handleSetAmount = async () => {
    if (qrSession && amount && currentUser) {
      const parsedAmount = parseFloat(amount);
      const level = currentUser.credicoraDetails || credicoraLevels['1'];
      const financedAmount = Math.min(parsedAmount * (1 - level.initialPaymentPercentage), currentUser.credicoraLimit || 0);
      const initialPayment = parsedAmount - financedAmount;
      await setQrSessionAmount(qrSession.id, parsedAmount, initialPayment, financedAmount, level.installments);
    }
  };

  const handleCancelSession = async () => {
    if(qrSession) await cancelQrSession(qrSession.id);
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setVoucherPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmMobilePayment = async () => {
    if (qrSession) {
      await confirmMobilePayment(qrSession.id);
    }
  };
  
  const handleFinalizeSession = async () => {
    if (qrSession) {
        await finalizeQrSession(qrSession.id);
    }
  }

  const renderContent = () => {
    if (!qrSession) {
      return (
        <div className="text-center space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Muestra este QR a tu cliente</h2>
                <p className="text-muted-foreground mt-1 text-sm">El cliente deberá escanearlo desde su app de Corabo para iniciar el pago.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl inline-block">
                 <QRCodeSVG 
                    value={qrValue} 
                    size={256}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Si el escaneo falla, el cliente puede usar tu:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-2xl font-bold font-mono tracking-widest">{manualCode}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={manualCode === 'N/A'}><Copy className="w-5 h-5"/></Button>
              </div>
            </div>
        </div>
      );
    }

    switch(qrSession.status) {
      case 'pendingAmount':
        return (
          <div className="text-center space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold">Cliente Conectado</h2>
            <p className="text-muted-foreground text-sm">Introduce el monto total de la venta para que el cliente lo apruebe.</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
              <Input 
                type="number" 
                placeholder="0.00"
                className="text-4xl font-bold h-20 text-center"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancelSession}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSetAmount} disabled={!amount}>Enviar Monto</Button>
            </div>
          </div>
        );
      case 'awaitingPayment':
        return (
          <div className="text-center space-y-6 w-full max-w-sm">
            <Hourglass className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />
            <h2 className="text-xl font-semibold">Esperando Pago Móvil</h2>
            <p className="text-muted-foreground text-sm">El cliente ha copiado tus datos de Pago Móvil. Confirma cuando recibas la transferencia por <span className="font-bold">${qrSession.initialPayment?.toFixed(2)}</span>.</p>
            <Button className="w-full" onClick={handleConfirmMobilePayment}>
              <CheckCircle className="mr-2 h-4 w-4" />
              He Recibido el Pago
            </Button>
             <Button variant="destructive" size="sm" onClick={handleCancelSession}>Cancelar Sesión</Button>
          </div>
        );
      case 'pendingVoucherUpload':
        return (
           <div className="text-center space-y-6 w-full max-w-sm">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Pago Recibido</h2>
            <p className="text-muted-foreground text-sm">El cliente ha sido notificado. Finaliza la transacción para generar los compromisos y la factura.</p>
            <Button className="w-full" onClick={handleFinalizeSession}>
                <FileText className="mr-2 h-4 w-4" />
                Finalizar y Generar Factura
            </Button>
          </div>
        );
      case 'pendingClientApproval':
        return (
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Esperando Aprobación</h2>
            <p className="text-muted-foreground text-sm">El cliente está revisando el monto de <span className="font-bold">${qrSession.amount?.toFixed(2)}</span>.</p>
          </div>
        );
      case 'completed':
          return (
             <div className="text-center space-y-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">¡Transacción Completada!</h2>
              <p className="text-muted-foreground text-sm">El pago ha sido registrado y los compromisos de Credicora han sido creados.</p>
              <Button onClick={() => router.push('/transactions')}>Ver en mi Registro</Button>
            </div>
          )
      default:
        return <p>Estado desconocido: {qrSession.status}</p>;
    }
  }


  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
       <header className="sticky top-0 z-10 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/80 rounded-full shadow-md hover:bg-background">
              <ChevronLeft className="h-6 w-6" />
          </Button>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {renderContent()}
      </main>
      <footer className="p-4">
         <Button className="w-full" variant="ghost" onClick={() => router.push('/scan-qr')}>
            <QrCode className="mr-2 h-4 w-4"/>
            Escanear Código para Pagar
          </Button>
      </footer>
    </div>
  );
}
