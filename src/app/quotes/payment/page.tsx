
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle, CreditCard, ChevronLeft, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const paymentOptions = [
    { id: 'basic', title: 'Básico', price: 3, quotes: 'Hasta 10', description: 'Envío a proveedores premium.' },
    { id: 'advanced', title: 'Avanzado', price: 4, quotes: 'Hasta 13', description: 'Prioridad en la lista de solicitudes.' },
    { id: 'premium', title: 'Premium', price: 5, quotes: 'Hasta 20', description: 'Máxima visibilidad y respuesta rápida.', icon: Star },
]

export default function QuotePaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // On component mount, check for the 'from' param to show a toast
    useEffect(() => {
        if (searchParams.get('from') === 'advanced-dialog') {
             toast({
                title: "Potencia tu Búsqueda",
                description: "Elige el plan que mejor se adapte a tus necesidades.",
            });
        }
    }, [searchParams, toast]);

    const handleConfirmPayment = () => {
        if (!selectedPlan) return;
        const plan = paymentOptions.find(p => p.id === selectedPlan);
        toast({
            title: "¡Pago Confirmado!",
            description: `Tu búsqueda ${plan?.title} ha sido activada. Recibirás ${plan?.quotes} cotizaciones.`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
        router.push('/quotes');
    };

    return (
        <div className="bg-muted/30 min-h-screen">
             <header className="bg-background/80 backdrop-blur sticky top-0 z-10">
                <div className="container px-4 sm:px-6 h-16 flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <div className="mx-auto max-w-md">
                    <Card className="shadow-lg">
                        <CardHeader className="items-center text-center">
                            <Zap className="w-12 h-12 text-yellow-500 mb-2" />
                            <CardTitle>Potencia tu Búsqueda</CardTitle>
                            <CardDescription>Elige un plan para recibir más y mejores cotizaciones.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            <div className="space-y-3">
                                {paymentOptions.map((option) => (
                                    <div 
                                        key={option.id}
                                        className={cn(
                                            "p-4 border rounded-lg cursor-pointer transition-all",
                                            selectedPlan === option.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                                        )}
                                        onClick={() => setSelectedPlan(option.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    {option.title}
                                                    {option.icon && <option.icon className="w-4 h-4 text-yellow-400 fill-yellow-400"/>}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{option.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{option.quotes} cotizaciones</p>
                                            </div>
                                            <p className="text-xl font-bold">${option.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                           
                            <div className="p-4 border rounded-lg mt-6">
                               <p className="font-semibold flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5"/> Método de Pago</p>
                               <p className="text-sm">Saldo Corabo: <span className="font-bold">$50.00</span></p>
                               <p className="text-xs text-muted-foreground">El monto será debitado de tu saldo disponible.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" onClick={handleConfirmPayment} disabled={!selectedPlan}>
                                {selectedPlan ? `Pagar $${paymentOptions.find(p => p.id === selectedPlan)?.price.toFixed(2)} y Enviar` : 'Selecciona un plan'}
                            </Button>
                            <Button variant="ghost" className="text-muted-foreground" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
