
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function QuotePaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // On component mount, check for the 'from' param to show a toast
    useEffect(() => {
        if (searchParams.get('from') === 'advanced-dialog') {
             toast({
                title: "Detalles del Pago",
                description: "Revisa los detalles y confirma tu pago para la búsqueda avanzada.",
            });
        }
    }, [searchParams, toast]);

    const handleConfirmPayment = () => {
        toast({
            title: "¡Pago Confirmado!",
            description: "Tu búsqueda avanzada ha sido activada. Tu solicitud se enviará a proveedores premium.",
            className: "bg-green-100 border-green-300 text-green-800",
        });
        router.push('/quotes');
    };

    return (
        <main className="container py-12">
            <div className="mx-auto max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="items-center text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                        <CardTitle>Confirmar Pago</CardTitle>
                        <CardDescription>Estás a un paso de enviar tu cotización a más proveedores.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                           <div className="flex justify-between font-semibold">
                                <span>Búsqueda Avanzada Premium</span>
                                <span>$3.00</span>
                           </div>
                           <p className="text-xs text-muted-foreground">
                            Incluye envío a usuarios con mejor reputación y respuesta más rápida.
                           </p>
                        </div>
                         <div className="p-4 border rounded-lg">
                           <p className="font-semibold flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5"/> Método de Pago</p>
                           <p className="text-sm">Saldo Corabo: <span className="font-bold">$50.00</span></p>
                           <p className="text-xs text-muted-foreground">El monto será debitado de tu saldo disponible.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" onClick={handleConfirmPayment}>
                            Pagar y Enviar Cotización
                        </Button>
                        <Button variant="ghost" className="text-muted-foreground" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}

