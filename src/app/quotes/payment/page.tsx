
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Banknote, Upload, Smartphone, Loader2 } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';


function PaymentHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Confirmar Pago</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { transactions, payCommitment, updateUser } = useCorabo();

    const [commitment, setCommitment] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentVoucher, setPaymentVoucher] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const commitmentId = searchParams.get('commitmentId');
        if (commitmentId) {
            const foundTx = transactions.find(tx => tx.id === commitmentId);
            setCommitment(foundTx || null);
        }
        setIsLoading(false);
    }, [searchParams, transactions]);

    const handleConfirmPayment = async () => {
        if (!commitment || !paymentReference || !paymentVoucher) {
            toast({ variant: 'destructive', title: 'Faltan datos', description: 'Por favor, sube el comprobante y añade la referencia.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // This reuses the payCommitment logic, which is fine for system payments.
            // For a real app, you might have a dedicated `confirmSystemPayment` flow.
            await payCommitment(commitment.id);
            toast({ title: '¡Pago Registrado!', description: 'Gracias. Tu pago será verificado por un administrador pronto.' });
            router.push('/transactions');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar tu pago. Inténtalo de nuevo.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>
    }

    if (!commitment) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <h2 className="text-xl font-bold">Transacción no encontrada</h2>
                <p className="text-muted-foreground">No se pudo encontrar el compromiso de pago.</p>
                <Button onClick={() => router.push('/transactions')} className="mt-4">Volver al Registro</Button>
            </div>
        )
    }

    return (
        <>
            <PaymentHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Pago</CardTitle>
                        <CardDescription>
                            Realiza el pago por el siguiente concepto y luego registra los detalles aquí.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Concepto:</span>
                            <span className="font-semibold">{commitment.details.system}</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-bold">
                            <span className="text-muted-foreground">Monto a Pagar:</span>
                            <span>${commitment.amount.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Datos de la Empresa (Corabo)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="p-3 bg-muted rounded-md space-y-1">
                            <p className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4" /> Cuenta Bancaria</p>
                            <div className="flex justify-between mt-1"><span>Banco:</span><span className="font-mono">Banco de Venezuela</span></div>
                            <div className="flex justify-between mt-1"><span>Cuenta:</span><span className="font-mono">0102-0333-30-0000982322</span></div>
                            <div className="flex justify-between mt-1"><span>Titular:</span><span className="font-mono">CorabO Soluciones Cercanas C.A.</span></div>
                            <div className="flex justify-between mt-1"><span>RIF:</span><span className="font-mono">J-50704220-0</span></div>
                        </div>
                         <div className="p-3 bg-muted rounded-md space-y-1">
                            <p className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4" /> Pago Móvil</p>
                            <div className="flex justify-between mt-1"><span>Teléfono:</span><span className="font-mono">0412-8978405</span></div>
                            <div className="flex justify-between mt-1"><span>Banco:</span><span className="font-mono">Banco de Venezuela (0102)</span></div>
                             <div className="flex justify-between mt-1"><span>RIF:</span><span className="font-mono">J-50704220-0</span></div>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Registra tu Comprobante</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reference">Número de Referencia</Label>
                            <Input id="reference" placeholder="00012345" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="voucher-upload">Comprobante (Captura de pantalla)</Label>
                             <div className="flex items-center gap-2">
                                 <Label htmlFor="voucher-upload" className="cursor-pointer flex-shrink-0">
                                     <Button asChild variant="outline">
                                         <span><Upload className="h-4 w-4 mr-2"/>Subir Archivo</span>
                                     </Button>
                                 </Label>
                                 <Input 
                                     id="voucher-upload" 
                                     type="file" 
                                     className="hidden" 
                                     accept="image/*"
                                     onChange={(e) => setPaymentVoucher(e.target.files ? e.target.files[0] : null)}
                                     />
                                 <span className={cn("text-sm text-muted-foreground truncate", paymentVoucher && "text-foreground font-medium")}>
                                     {paymentVoucher ? paymentVoucher.name : 'Ningún archivo seleccionado...'}
                                 </span>
                             </div>
                        </div>
                     </CardContent>
                </Card>

                <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting || !paymentReference || !paymentVoucher}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Confirmar y Enviar Pago'}
                </Button>

            </main>
        </>
    );
}
