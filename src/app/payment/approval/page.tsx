

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Handshake, AlertTriangle, Smartphone, Copy, Banknote, Star } from 'lucide-react';
import { User, credicoraLevels, QrSession } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleClientCopyAndPay, cancelQrSession } from '@/lib/actions/cashier.actions';


function ApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, users } = useAuth();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<User | null>(null);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This needs to be replaced with a proper exchange rate mechanism
  const exchangeRate = 36.5; 

  const sessionId = searchParams?.get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'qr_sessions', sessionId), (doc) => {
      const session = doc.data() as QrSession;
      setQrSession(session);

      if (session && session.providerId && !provider) {
        const p = users.find(u => u.id === session.providerId)
        setProvider(p || null);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsub();

  }, [sessionId, users, provider]);

  const handleCopyAndPay = async () => {
    if (!sessionId || !provider || !provider.profileSetupData?.paymentDetails?.mobile) return;
    
    const amountToPayInBs = (qrSession?.initialPayment || qrSession?.amount || 0) * exchangeRate;

    const { bankName, mobilePaymentPhone } = provider.profileSetupData.paymentDetails.mobile;
    const idNumber = provider.idNumber;
    const textToCopy = `Pago Móvil\nBanco: ${bankName}\nTeléfono: ${mobilePaymentPhone}\nCédula/RIF: ${idNumber}\nMonto: ${amountToPayInBs.toFixed(2)}`;
    
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Datos de Pago Copiados', description: 'Realiza el pago desde tu app bancaria.' });
    
    await handleClientCopyAndPay(sessionId);
  };


  const handleCancel = async () => {
    if(sessionId) {
      await cancelQrSession(sessionId);
      router.back();
    }
  }
  
  const renderContentByStatus = () => {
    if (isLoading || !qrSession || !provider) {
        return (
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="font-semibold">Esperando monto del proveedor...</p>
                <p className="text-sm text-muted-foreground">Mantén esta pantalla abierta.</p>
            </div>
        )
    }

    if (qrSession.status === 'awaitingPayment') {
        return (
            <div className="text-center space-y-4">
                <Banknote className="h-12 w-12 mx-auto text-blue-500" />
                <p className="font-semibold">Esperando Confirmación del Pago</p>
                <p className="text-sm text-muted-foreground">Ya puedes cerrar esta pantalla. Recibirás una notificación cuando el proveedor confirme la transacción.</p>
                <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
            </div>
        );
    }
    
    if(qrSession.status === 'pendingVoucherUpload') {
       return (
         <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="font-semibold">Pago Aprobado</p>
            <p className="text-sm text-muted-foreground">Esperando que ${provider.name} confirme la transacción y cargue la factura.</p>
         </div>
       )
    }
    
    if(qrSession.status === 'cancelled') {
       return (
         <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <p className="font-semibold">Sesión Cancelada</p>
            <p className="text-sm text-muted-foreground">La sesión de pago ha sido cancelada.</p>
             <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
         </div>
       )
    }
    
    if(qrSession.status === 'pendingClientApproval') {
        const { amount = 0, initialPayment = 0, financedAmount = 0, installments = 0 } = qrSession;
        const mobilePaymentInfo = provider.profileSetupData?.paymentDetails?.mobile;
        const isFinanced = financedAmount > 0;
        const amountToPayToday = isFinanced ? initialPayment : amount;

        return (
             <>
                <CardHeader>
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-primary">
                        <AvatarImage src={provider.profileImage} />
                        <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center">Confirmar Pago a ${provider.name}</CardTitle>
                    <CardDescription className="text-center">
                        {isFinanced ? "Tu compra será financiada con Credicora." : "Realiza el pago y espera la confirmación del proveedor."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total de la Compra</p>
                        <p className="text-5xl font-bold tracking-tighter">${amount.toFixed(2)}</p>
                    </div>

                    {isFinanced && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
                        <div className="font-bold text-center flex items-center justify-center gap-2"><Star className="w-5 h-5 fill-current"/> Desglose Credicora</div>
                        <div className="flex justify-between"><span>Pagas hoy (Inicial):</span> <span className="font-bold">${initialPayment.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Monto financiado:</span> <span className="font-bold">${financedAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Próximos pagos:</span> <span className="font-bold">${installments} cuotas</span></div>
                      </div>
                    )}

                     {mobilePaymentInfo?.active && (
                        <div className="p-4 bg-muted rounded-lg border text-sm space-y-1">
                             <p className="font-semibold flex items-center gap-2 mb-2"><Smartphone className="w-4 h-4"/> Realiza un Pago Móvil por la inicial:</p>
                             <div className="flex justify-between mt-1"><span>Banco:</span><span className="font-mono">{mobilePaymentInfo.bankName}</span></div>
                             <div className="flex justify-between mt-1"><span>Teléfono:</span><span className="font-mono">{mobilePaymentInfo.mobilePaymentPhone}</span></div>
                             <div className="flex justify-between mt-1"><span>Cédula/RIF:</span><span className="font-mono">{provider.idNumber}</span></div>
                             <div className="flex justify-between mt-1 font-bold"><span>Monto:</span><span className="font-mono">BS. ${(amountToPayToday * exchangeRate).toFixed(2)}</span></div>
                        </div>
                     )}
                </CardContent>
                <div className="p-6 pt-0 grid grid-cols-2 gap-4">
                     <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
                     <Button onClick={handleCopyAndPay} disabled={!mobilePaymentInfo?.active}><Copy className="mr-2 h-4 w-4" />Copiar y Pagar</Button>
                </div>
            </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        {renderContentByStatus()}
      </Card>
    </div>
  );
}


export default function ApprovalPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <ApprovalContent />
        </Suspense>
    )
}
