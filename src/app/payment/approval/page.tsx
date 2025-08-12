
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Handshake, AlertTriangle } from 'lucide-react';
import { User, credicoraLevels } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function ApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { qrSession, fetchUser, approveQrSession, cancelQrSession, currentUser } = useCorabo();
  
  const [provider, setProvider] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (qrSession && qrSession.providerId) {
      fetchUser(qrSession.providerId).then(p => {
        setProvider(p);
        if (qrSession.status !== 'pendingClientApproval') {
          setIsLoading(true); // Keep loading while waiting for amount
        } else {
          setIsLoading(false);
        }
      });
    } else {
        // If there's no session, stop loading
        setIsLoading(false);
    }
  }, [qrSession, fetchUser]);

  const handleApprove = () => {
    if(sessionId) {
      approveQrSession(sessionId);
    }
  }

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
        return (
             <>
                <CardHeader>
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-primary">
                        <AvatarImage src={provider.profileImage} />
                        <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center">Confirmar Pago a {provider.name}</CardTitle>
                    <CardDescription className="text-center">
                        Revisa los detalles de la compra. Al aceptar, se generarán los compromisos de pago.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Monto Total de la Compra</p>
                        <p className="text-5xl font-bold tracking-tighter">${amount.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border text-center space-y-2">
                         <p className="text-sm font-semibold text-blue-600">Detalles de Credicora</p>
                         <p className="text-lg">Pagas hoy en persona: <span className="font-bold">${initialPayment.toFixed(2)}</span></p>
                         <p className="text-sm text-muted-foreground">Se crearán {installments} compromisos de <span className="font-semibold">${(financedAmount / installments).toFixed(2)}</span></p>
                    </div>
                </CardContent>
                <div className="p-6 pt-0 grid grid-cols-2 gap-4">
                     <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
                     <Button onClick={handleApprove}><Handshake className="mr-2 h-4 w-4" />Aceptar y Pagar</Button>
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
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>}>
            <ApprovalContent />
        </Suspense>
    )
}
