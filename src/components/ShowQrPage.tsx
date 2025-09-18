
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info, Copy, Loader2, QrCode, UploadCloud, CheckCircle, Smartphone, Banknote, Hourglass, FileText, User, Clock, X, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, ChangeEvent, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe, doc } from 'firebase/firestore';
import type { QrSession, User, Transaction } from '@/lib/types';
import { setQrSessionAmount, cancelQrSession, confirmMobilePayment, finalizeQrSession, closeCashierSession } from '@/lib/actions/cashier.actions';
import { credicoraLevels } from '@/lib/types';
import { PrintableQrDisplay } from '@/components/PrintableQrDisplay';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { getFirestoreInstance } from '@/lib/firebase-client';

export default function ShowQrPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { users, qrSession: authQrSession } = useAuth();
  const [firestore, setFirestore] = useState<any>(null);

  const [qrSession, setQrSession] = useState<QrSession | null>(authQrSession);
  const [provider, setProvider] = useState<User | null>(null);
  const [sessionTransactions, setSessionTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('sessionId');

  const totalCollected = useMemo(() => {
    return sessionTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [sessionTransactions]);

  useEffect(() => {
    getFirestoreInstance().then(setFirestore);
  }, []);
  
  useEffect(() => {
      setQrSession(authQrSession);
  }, [authQrSession]);

  useEffect(() => {
    if (!sessionId || !firestore) {
      setIsLoading(false);
      return;
    }
    
    if (qrSession?.providerId && !provider) {
        const foundProvider = users.find(u => u.id === qrSession.providerId);
        setProvider(foundProvider || null);
    }
    
    if (qrSession?.status === 'closed') {
        const qTransactions = query(collection(firestore, 'transactions'), where('details.qrSessionId', '==', sessionId));
        const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
            setSessionTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
        });
        setIsLoading(false);
        return () => unsubTransactions();
    }
    
    setIsLoading(false);
  }, [sessionId, users, provider, firestore, qrSession]);


  if (isLoading || !qrSession) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const manualCode = provider?.coraboId || 'N/A';
  const box = provider?.profileSetupData?.cashierBoxes?.find(b => b.id === qrSession.cashierBoxId);
  const qrValue = box?.qrValue || '';

  const handleCopyCode = () => {
    if (manualCode !== 'N/A') {
      navigator.clipboard.writeText(manualCode);
      toast({ title: 'Copiado', description: 'El código manual del negocio ha sido copiado.' });
    }
  };

  const handleSetAmount = async () => {
    if (qrSession && amount && provider) {
      const parsedAmount = parseFloat(amount);
      const level = provider.credicoraDetails || credicoraLevels['1'];
      const financedAmount = Math.min(parsedAmount * (1 - level.initialPaymentPercentage), provider.credicoraLimit || 0);
      const initialPayment = parsedAmount - financedAmount;
      await setQrSessionAmount(qrSession.id, parsedAmount, initialPayment, financedAmount, level.installments);
    }
  };

  const handleCancelSession = async () => {
    if(qrSession) await cancelQrSession(qrSession.id);
  }

  const handleConfirmMobilePayment = async () => {
    if (qrSession) {
      await confirmMobilePayment(qrSession.id);
    }
  };
  
  const handleFinalizeSession = async () => {
    if (qrSession) {
        await finalizeQrSession(qrSession.id);
        // Reset amount for the next transaction
        setAmount('');
    }
  }

  const handleCloseSession = async () => {
      if (qrSession) {
          await closeCashierSession(qrSession.id);
      }
  }
  
  const renderContent = () => {
    if (qrSession.status === 'awaiting_scan') {
      return (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-white drop-shadow-md">Muestra este QR a tu cliente</h2>
          <p className="text-white/80 mt-1 text-sm drop-shadow-md">El cliente deberá escanearlo desde su app de Corabo para iniciar el pago.</p>
          <div className="bg-white p-6 rounded-2xl shadow-xl inline-block mt-4">
                 <QRCodeSVG 
                    value={qrValue} 
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                />
            </div>
             <div className="text-center mt-4">
              <p className="text-sm text-white/80 drop-shadow-md">Si el escaneo falla, el cliente puede usar el ID:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-2xl font-bold font-mono tracking-widest text-white drop-shadow-lg">{manualCode}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={manualCode === 'N/A'} className="text-white/80 hover:text-white"><Copy className="w-5 h-5"/></Button>
              </div>
            </div>
        </div>
      );
    }

    if (qrSession.status === 'closed') {
        return (
             <div className="text-center space-y-4 w-full max-w-sm text-white">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <h2 className="text-2xl font-bold drop-shadow-md">Turno Finalizado</h2>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between"><span>Cajero:</span><span className="font-semibold">{qrSession.cashierName}</span></div>
                    <div className="flex justify-between"><span>Caja:</span><span className="font-semibold">{box?.name}</span></div>
                    <div className="flex justify-between"><span>Total Recaudado:</span><span className="font-bold">${totalCollected.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Transacciones:</span><span className="font-semibold">{sessionTransactions.length}</span></div>
                    <div className="flex justify-between"><span>Cierre:</span><span className="font-semibold">{qrSession.closedAt ? format(new Date(qrSession.closedAt), 'h:mm a') : 'N/A'}</span></div>
                </div>
                 <ScrollArea className="h-48 my-4 bg-black/20 rounded-lg p-2">
                    <div className="space-y-2">
                    {sessionTransactions.map(tx => (
                        <div key={tx.id} className="text-left text-xs p-2 bg-black/20 rounded-md">
                            <div className="flex justify-between">
                                <span className="font-semibold">{tx.details.items?.map(i => i.product.name).join(', ') || tx.details.system || 'Venta'}</span>
                                <span className="font-bold">${tx.amount.toFixed(2)}</span>
                            </div>
                            <span className="text-white/70">{format(new Date(tx.date), 'p')}</span>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <Button onClick={() => router.push('/cashier-login')} className="w-full">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Salir y Finalizar
                </Button>
            </div>
        )
    }

    switch(qrSession.status) {
      case 'pendingAmount':
        return (
          <div className="text-center space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-white drop-shadow-md">Cliente Conectado</h2>
            <p className="text-white/80 text-sm drop-shadow-md">Introduce el monto total de la venta para que el cliente lo apruebe.</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
              <Input 
                type="number" 
                placeholder="0.00"
                className="text-4xl font-bold h-20 text-center bg-white/90"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-black/20 text-white border-white/50 hover:bg-black/40 hover:text-white" onClick={handleCancelSession}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSetAmount} disabled={!amount}>Enviar Monto</Button>
            </div>
          </div>
        );
      case 'awaitingPayment':
        return (
          <div className="text-center space-y-6 w-full max-w-sm text-white">
            <Hourglass className="h-16 w-16 mx-auto animate-pulse" />
            <h2 className="text-xl font-semibold drop-shadow-md">Esperando Pago Móvil</h2>
            <p className="text-white/80 text-sm drop-shadow-md">El cliente ha copiado tus datos de Pago Móvil. Confirma cuando recibas la transferencia por <span className="font-bold">${qrSession.initialPayment?.toFixed(2)}</span>.</p>
            <Button className="w-full" onClick={handleConfirmMobilePayment}>
              <CheckCircle className="mr-2 h-4 w-4" />
              He Recibido el Pago
            </Button>
             <Button variant="destructive" size="sm" onClick={handleCancelSession}>Cancelar Sesión</Button>
          </div>
        );
      case 'pendingVoucherUpload':
        return (
           <div className="text-center space-y-6 w-full max-w-sm text-white">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
            <h2 className="text-xl font-semibold drop-shadow-md">Pago Recibido</h2>
            <p className="text-white/80 text-sm drop-shadow-md">El cliente ha sido notificado. Finaliza la transacción para volver a la pantalla de espera.</p>
            <Button className="w-full" onClick={handleFinalizeSession}>
                <FileText className="mr-2 h-4 w-4" />
                Finalizar y Volver a Esperar
            </Button>
          </div>
        );
      case 'pendingClientApproval':
        return (
          <div className="text-center space-y-6 text-white">
            <Loader2 className="h-16 w-16 animate-spin" />
            <h2 className="text-xl font-semibold drop-shadow-md">Esperando Aprobación</h2>
            <p className="text-white/80 text-sm drop-shadow-md">El cliente está revisando el monto de <span className="font-bold">${qrSession.amount?.toFixed(2)}</span>.</p>
          </div>
        );
      case 'completed':
          return (
             <div className="text-center space-y-6 text-white">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
              <h2 className="text-xl font-semibold drop-shadow-md">¡Transacción Completada!</h2>
              <p className="text-white/80 text-sm drop-shadow-md">El pago ha sido registrado y los compromisos de Credicora han sido creados.</p>
              <Button onClick={() => router.push('/transactions')}>Ver en mi Registro</Button>
            </div>
          )
      default:
        return <p>Estado desconocido: {qrSession.status}</p>;
    }
  }


  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      <img
        src="https://i.postimg.cc/8PqnSgLp/welcome-bg.png"
        alt="Fondo de bienvenida"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        data-ai-hint="background office"
      />
       <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />

       <header className="sticky top-0 z-10 p-4 flex items-center justify-between">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="bg-black/30 rounded-full shadow-md hover:bg-black/50">
                        <X className="h-6 w-6" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Finalizar Turno?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto cerrará tu sesión de caja actual. Podrás ver un resumen de tu actividad antes de salir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseSession}>Cerrar Caja</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          <img src="https://i.postimg.cc/T3sS8Yh3/logo-light-png.png" alt="Corabo Logo" style={{ height: '33px', width: 'auto' }} />
          <div className="w-8"></div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 z-10">
        {renderContent()}
      </main>

       <footer className="z-10 p-4 text-center text-sm text-white/70">
            {provider && box && (
                <div className="space-y-1">
                    <p className="font-bold">{provider.name} (RIF: {provider.idNumber})</p>
                    <p>Caja: <span className="font-semibold">{box.name}</span></p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{qrSession.cashierName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>Apertura: {format(new Date(qrSession.createdAt), 'h:mm a')}</span>
                        </div>
                    </div>
                </div>
            )}
       </footer>
    </div>
  );
}
