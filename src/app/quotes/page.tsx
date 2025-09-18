
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QuoteRequestInputSchema, type QuoteRequestInput, type User } from '@/lib/types';
import { allCategories } from '@/lib/data/options';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { createQuoteRequest } from '@/lib/actions/transaction.actions';
import { sendNewQuoteRequestNotifications } from '@/lib/actions/notification.actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { useAuth } from '@/hooks/use-auth';


const getQuoteCost = (user: User | null): number => {
    if (!user || user.type === 'client') return 1;
    if (user.profileSetupData?.providerType === 'company') return 5;
    return 2; // Professional provider
}

export default function QuotesPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentDialog, setIsPaymentDialog] = useState(false);
    const [formValues, setFormValues] = useState<QuoteRequestInput | null>(null);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

    const form = useForm<QuoteRequestInput>({
        resolver: zodResolver(QuoteRequestInputSchema),
        defaultValues: {
            clientId: currentUser?.id || '',
            title: '',
            description: '',
            category: '',
        }
    });
    
    async function processQuoteCreation(values: QuoteRequestInput) {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            const newTransaction = await createQuoteRequest({ ...values, clientId: currentUser.id, isPaid: true });
            
            await sendNewQuoteRequestNotifications({
                category: values.category,
                title: values.title,
                transactionId: newTransaction.id,
            });

            toast({
                title: '¡Solicitud Enviada!',
                description: 'Los proveedores de la categoría seleccionada serán notificados.',
            });
            router.push('/transactions');
        } catch (error) {
            console.error("Failed to create quote request:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud.' });
        } finally {
            setIsSubmitting(false);
            setFormValues(null);
            setIsPaymentDialog(false);
        }
    }

    async function onSubmit(values: QuoteRequestInput) {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para solicitar una cotización.' });
            return;
        }

        if (currentUser.isSubscribed) {
            await processQuoteCreation(values);
            return;
        }
        
        // Logic for non-subscribed users
        try {
            const result = await createQuoteRequest({ ...values, clientId: currentUser.id, isPaid: false });
            if (result.requiresPayment) {
                 setFormValues(values);
                 setIsPaymentDialog(true);
            } else {
                 toast({
                    title: '¡Solicitud Gratuita Enviada!',
                    description: 'Has usado tu cotización gratuita de la semana. Los proveedores serán notificados.',
                });
                router.push('/transactions');
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la solicitud.' });
        }
    }
    
    if (!currentUser) {
        return <p>Cargando...</p>;
    }

    const quoteCost = getQuoteCost(currentUser);

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Publica lo que necesitas, recibe lo que buscas</CardTitle>
                        <CardDescription>Dinos qué servicio o producto necesitas. Los mejores profesionales de la comunidad te enviarán sus propuestas directamente. ¡Es fácil, rápido y gratis para empezar!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título de la Solicitud</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Reparación de aire acondicionado" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Categoría del Servicio</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona la categoría más relevante" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {allCategories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Describe tu necesidad con detalle</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Incluye detalles como: marca y modelo del equipo, dimensiones del espacio, problema específico, etc. Mientras más detalles, mejores serán las cotizaciones."
                                                    rows={6}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar Solicitud a Profesionales
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {!currentUser.isSubscribed && (
                    <Card className="mt-8 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
                        <CardContent className="p-6 text-center">
                        <div className="mx-auto bg-primary/20 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold">Envia y Recibe Propuestas Ilimitadas</h3>
                        <p className="text-muted-foreground mt-2 mb-4">
                            Suscríbete para enviar todas las solicitudes de cotización que necesites y contactar con los mejores profesionales sin límites.
                        </p>
                        <Button onClick={() => setIsSubscriptionDialogOpen(true)}>
                            Ver Planes de Suscripción
                        </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={isPaymentDialog} onOpenChange={setIsPaymentDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Envío de Cotización</AlertDialogTitle>
                        <AlertDialogDescription>
                           Ya has utilizado tu cotización gratuita de esta semana. Para enviar esta solicitud, se requiere un pago de ${quoteCost.toFixed(2)}. ¿Deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (formValues) {
                                router.push(`/payment?amount=${quoteCost}&concept=${encodeURIComponent(`Cotización: ${formValues.title}`)}`);
                            }
                        }}>
                            Proceder al Pago
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
        </>
    );
}
