
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle, CreditCard, ChevronLeft, Star, Zap, Smartphone, Landmark, AlertCircle, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const EXCHANGE_RATE = 130; // 130 Bs per dollar

export default function QuotePaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [amount, setAmount] = useState(3); // Default amount in dollars
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get('from') === 'advanced-dialog') {
             toast({
                title: "Potencia tu Búsqueda",
                description: "Elige el plan que mejor se adapte a tus necesidades.",
            });
        }
    }, [searchParams, toast]);

    const handleConfirmPayment = () => {
        if (!selectedPaymentMethod) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor, selecciona un método de pago.'
            });
            return;
        }
        toast({
            title: "¡Pago Confirmado!",
            description: `Tu búsqueda por $${amount.toFixed(2)} ha sido activada.`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
        router.push('/quotes');
    };

    const bolivaresAmount = (amount * EXCHANGE_RATE).toFixed(2);

    return (
        <div className="bg-muted/30 min-h-screen">
             <header className="bg-background/80 backdrop-blur sticky top-0 z-10">
                <div className="container px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                     <Button variant="ghost" size="icon">
                        <AlertCircle className="h-6 w-6 text-muted-foreground"/>
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <div className="mx-auto max-w-md">
                    <Card className="shadow-lg">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4 py-8">
                                <div className="flex items-center justify-center gap-4">
                                     <Button variant="outline" size="icon" onClick={() => setAmount(Math.max(1, amount - 1))} className="rounded-full w-10 h-10">
                                        <Minus className="w-5 h-5"/>
                                     </Button>
                                    <h1 className="text-5xl font-bold text-teal-500">${amount.toFixed(2)}</h1>
                                     <Button variant="outline" size="icon" onClick={() => setAmount(amount + 1)} className="rounded-full w-10 h-10">
                                        <Plus className="w-5 h-5"/>
                                     </Button>
                                </div>
                                <p className="text-muted-foreground">Bs.: {bolivaresAmount}</p>
                            </div>

                            <Separator />

                            <div className="py-6 space-y-4">
                               <p className="font-semibold text-center">Selecciona Método de Pago</p>
                               <div className="space-y-3">
                                   <Button 
                                        variant={selectedPaymentMethod === 'mobile' ? 'default' : 'secondary'}
                                        className="w-full h-16 text-base justify-start px-6"
                                        onClick={() => setSelectedPaymentMethod('mobile')}
                                    >
                                       <Smartphone className="mr-4 h-6 w-6"/> Pago Móvil
                                   </Button>
                                    <Button 
                                        variant={selectedPaymentMethod === 'transfer' ? 'default' : 'secondary'}
                                        className="w-full h-16 text-base justify-start px-6"
                                        onClick={() => setSelectedPaymentMethod('transfer')}
                                    >
                                       <Landmark className="mr-4 h-6 w-6"/> Transferencia
                                   </Button>
                               </div>
                            </div>
                            
                            <div className="p-4 border rounded-lg bg-muted/50 mt-4">
                                <h3 className="font-semibold text-center">O suscríbete y cotiza sin límites según tu nivel</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">Disfruta de búsquedas avanzadas ilimitadas, insignia de verificado y más.</p>
                                <Button className="w-full mt-4" variant="outline" onClick={() => router.push('/contacts')}>
                                    <Star className="mr-2 h-4 w-4"/>
                                    Suscribirme ahora
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                     <div className="mt-6">
                        <Button className="w-full h-12 text-lg" onClick={handleConfirmPayment} disabled={!selectedPaymentMethod}>
                           Continuar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

