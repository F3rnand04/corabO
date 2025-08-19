
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Handshake, AlertTriangle, Smartphone, Copy, Banknote } from 'lucide-react';
import { User, credicoraLevels } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

function ApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { qrSession, fetchUser, approveQrSession, cancelQrSession, currentUser, handleClientCopyAndPay } = useCorabo();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (qrSession && qrSession.providerId) {
      fetchUser(qrSession.providerId).then(p => {
        setProvider(p);
        if (qrSession.status !== 'pendingClientApproval') {
          setIsLoading(true);
        } else {
          setIsLoading(false);
        }
      });
    } else {
        setIsLoading(false);
    }
  }, [qrSession, fetchUser]);

  const handleCopyAndPay = () => {
    if (!sessionId || !provider || !provider.profileSetupData?.paymentDetails?.mobile) return;
    
    const { bankName, mobilePaymentPhone } = provider.profileSetupData.paymentDetails.mobile;
    const idNumber = provider.idNumber;
    const textToCopy = `Pago Móvil\nBanco: ${bankName}\nTeléfono: ${mobilePaymentPhone}\nCédula/RIF: ${idNumber}`;
    
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Datos de Pago Copiados', description: 'Realiza el pago desde tu app bancaria.' });
    
    handleClientCopyAndPay(sessionId);
  };


  const handleCancel = () => {
    if(sessionId) {
      cancelQrSession(sessionId);
      router.back();
    }
  }
  
  const renderContentByStatus = () => {
    if (!qrSession || isLoading || !provider) {
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
            <p className="text-sm text-muted-foreground">Esperando que {provider.name} confirme la transacción y cargue la factura.</p>
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

        return (
             <>
                <CardHeader>
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-primary">
                        <AvatarImage src={provider.profileImage} />
                        <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center">Confirmar Pago a {provider.name}</CardTitle>
                    <CardDescription className="text-center">
                        Realiza el pago y espera la confirmación del proveedor.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Monto Total de la Compra</p>
                        <p className="text-5xl font-bold tracking-tighter">${amount.toFixed(2)}</p>
                    </div>
                     {mobilePaymentInfo?.active && (
                        <div className="p-4 bg-muted rounded-lg border text-sm space-y-1">
                             <p className="font-semibold flex items-center gap-2 mb-2"><Smartphone className="w-4 h-4"/> Realiza un Pago Móvil a:</p>
                             <p><strong>Banco:</strong> {mobilePaymentInfo.bankName}</p>
                             <p><strong>Teléfono:</strong> {mobilePaymentInfo.mobilePaymentPhone}</p>
                             <p><strong>Cédula/RIF:</strong> {provider.idNumber}</p>
                             <p><strong>Monto:</strong> <span className="font-mono">BS. {(amount * exchangeRate).toFixed(2)}</span></p>
                        </div>
                     )}
                </CardContent>
                <div className="p-6 pt-0 grid grid-cols-2 gap-4">
                     <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
                     <Button onClick={handleCopyAndPay} disabled={!mobilePaymentInfo?.active}><Copy className="mr-2 h-4 w-4" />Copiar Datos y Pagar</Button>
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
