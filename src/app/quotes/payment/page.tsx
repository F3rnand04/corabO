
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle, CreditCard, ChevronLeft, Star, Zap, Smartphone, Landmark, AlertCircle, Plus, Minus, TrendingUp, Upload, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EXCHANGE_RATE = 130; // 130 Bs per dollar

export default function QuotePaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [amount, setAmount] = useState(3); // Default amount in dollars
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [reference, setReference] = useState('');


    useEffect(() => {
        if (searchParams.get('from') === 'advanced-dialog') {
             toast({
                title: "Potencia tu Búsqueda",
                description: "Elige el plan que mejor se adapte a tus necesidades.",
            });
        }
    }, [searchParams, toast]);
    
    const handleSelectPaymentMethod = (method: string) => {
        setSelectedPaymentMethod(method);
        setStep(2);
    };


    const handleConfirmPayment = () => {
        if (!reference || !voucherFile) {
             toast({
                variant: 'destructive',
                title: 'Faltan datos',
                description: 'Por favor, sube el comprobante y añade el número de referencia.'
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
    
    const getBenefitMessage = () => {
        if (amount <= 3) {
            return "Recibe hasta **10 cotizaciones** de nuestra red de proveedores.";
        }
        if (amount === 4) {
            return "Tu solicitud será **destacada** y recibirás hasta **13 cotizaciones**.";
        }
        return "Conviértete en **prioridad máxima**. Tu solicitud destacará y recibirás hasta **20 cotizaciones**.";
    };
    
    const paymentData = {
        'mobile': { bank: "Banco de Corabo", phone: "0412-1234567", rif: "J-12345678-9" },
        'transfer': { bank: "Banco de Corabo", account: "0102-0123-4567-8901-2345", rif: "J-12345678-9", holder: "Corabo C.A." },
    }
    
    const selectedData = selectedPaymentMethod ? paymentData[selectedPaymentMethod as keyof typeof paymentData] : null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado', description: `${text} ha sido copiado.` });
    }

    return (
        <div className="bg-muted/30 min-h-screen">
             <header className="bg-background/80 backdrop-blur sticky top-0 z-10">
                <div className="container px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => step === 2 ? setStep(1) : router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                     <Button variant="ghost" size="icon">
                        <AlertCircle className="h-6 w-6 text-muted-foreground"/>
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <div className="mx-auto max-w-md">
                    <Card className="shadow-lg overflow-hidden">
                        <CardContent className={cn("p-6 transition-all duration-500", step === 2 && "max-h-0 opacity-0 p-0")}>
                            <div className="text-center space-y-2 py-8">
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
                                <div className="text-center pt-4">
                                    <p 
                                        className="text-sm text-foreground/90 transition-all duration-300 min-h-[40px]" 
                                        dangerouslySetInnerHTML={{ __html: getBenefitMessage() }}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="py-6 space-y-4">
                               <p className="font-semibold text-center">Selecciona Método de Pago</p>
                               <div className="space-y-3">
                                   <Button 
                                        variant={selectedPaymentMethod === 'mobile' ? 'default' : 'secondary'}
                                        className="w-full h-16 text-base justify-start px-6"
                                        onClick={() => handleSelectPaymentMethod('mobile')}
                                    >
                                       <Smartphone className="mr-4 h-6 w-6"/> Pago Móvil
                                   </Button>
                                    <Button 
                                        variant={selectedPaymentMethod === 'transfer' ? 'default' : 'secondary'}
                                        className="w-full h-16 text-base justify-start px-6"
                                        onClick={() => handleSelectPaymentMethod('transfer')}
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

                        {/* Step 2: Payment Details */}
                        <CardContent className={cn("p-6 transition-all duration-500", step === 1 && "max-h-0 opacity-0 p-0")}>
                           <div className="space-y-6">
                             <h3 className="font-semibold text-center">Completa tu pago y regístralo</h3>
                             {selectedData && (
                                 <div className="text-sm bg-background p-4 rounded-lg border space-y-2">
                                     <p className="font-bold mb-2">Realiza el pago a los siguientes datos:</p>
                                     <div className="flex justify-between items-center"><span>Banco:</span> <span className="font-mono">{selectedData.bank}</span></div>
                                     { 'phone' in selectedData && <div className="flex justify-between items-center"><span>Teléfono:</span> <span className="font-mono">{selectedData.phone}</span></div> }
                                     { 'account' in selectedData && <div className="flex justify-between items-center"><span>Cuenta:</span> <span className="font-mono">{selectedData.account}</span></div> }
                                     { 'holder' in selectedData && <div className="flex justify-between items-center"><span>Titular:</span> <span className="font-mono">{selectedData.holder}</span></div> }
                                     <div className="flex justify-between items-center"><span>RIF:</span> <span className="font-mono">{selectedData.rif}</span></div>
                                 </div>
                             )}

                             <div className="space-y-4">
                                <p className="text-sm font-semibold text-foreground">Luego, registra tu pago aquí:</p>
                                <div className="space-y-2">
                                    <Label htmlFor="voucher-upload">Comprobante de Pago</Label>
                                    <div className="flex items-center gap-2">
                                      <Button asChild variant="outline" size="icon"><Label htmlFor="voucher-upload" className="cursor-pointer"><Upload className="h-4 w-4"/></Label></Button>
                                       <Input 
                                          id="voucher-upload" 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e: ChangeEvent<HTMLInputElement>) => setVoucherFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                       <span className={cn("text-sm text-muted-foreground", voucherFile && "text-foreground font-medium")}>
                                         {voucherFile ? voucherFile.name : 'Seleccionar archivo...'}
                                       </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                   <Label htmlFor="reference">Número de Referencia</Label>
                                   <Input id="reference" placeholder="00012345" value={reference} onChange={(e) => setReference(e.target.value)} />
                                </div>
                             </div>
                           </div>
                        </CardContent>
                    </Card>
                     <div className="mt-6">
                        {step === 2 && (
                            <Button className="w-full h-12 text-lg" onClick={handleConfirmPayment} disabled={!reference || !voucherFile}>
                               <Check className="mr-2 h-5 w-5"/>
                               Confirmar Pago
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
