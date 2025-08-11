
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCorabo } from "@/contexts/CoraboContext";
import { Home, Settings, Wallet, ListChecks, History, CalendarClock, ChevronLeft, Loader2, Star, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import TransactionsLineChart from "@/components/charts/TransactionsLineChart";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import type { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { TransactionList } from "@/components/TransactionList";
import { ActivationWarning } from "@/components/ActivationWarning";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { credicoraLevels } from "@/lib/types";
import Link from "next/link";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";


function TransactionsHeader({ onBackToSummary, currentView }: { onBackToSummary: () => void, currentView: string }) {
    const router = useRouter();
    
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => currentView !== 'summary' ? onBackToSummary() : router.push('/')}>
                        {currentView !== 'summary' ? <ChevronLeft className="h-6 w-6" /> : <Home className="h-6 w-6" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-lg font-semibold">Registro de Transacciones</h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/transactions/settings')}>
                        <Settings className="h-6 w-6 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </header>
    );
}

const ActionButton = ({ icon: Icon, label, count, onClick }: { icon: React.ElementType, label: string, count: number, onClick: () => void }) => (
    <Button variant="outline" className="flex flex-col h-24 w-full items-center justify-center gap-1 relative" onClick={onClick}>
        {count > 0 && <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{count}</span>}
        <Icon className="w-8 h-8 text-primary" />
        <span className="text-xs text-center">{label}</span>
    </Button>
);


export default function TransactionsPage() {
    const { currentUser, getUserMetrics, getAgendaEvents } = useCorabo();
    const { toast } = useToast();
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [view, setView] = useState<'summary' | 'pending' | 'history' | 'commitments'>('summary');
    
    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const db = getFirestoreDb();
        const txQuery = query(
            collection(db, "transactions"),
            where("participantIds", "array-contains", currentUser.id)
        );

        const unsubscribe = onSnapshot(txQuery, (snapshot) => {
            const serverTransactions = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    ...data,
                    id: doc.id,
                    date: new Date(data.date).toISOString(),
                 } as Transaction;
            });
            setTransactions(serverTransactions);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las transacciones.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);


    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const agendaEvents = getAgendaEvents(transactions);
    const paymentDates = agendaEvents.filter(e => e.type === 'payment').map(e => e.date);

    const handleDayClick = (day: Date) => {
        const eventOnDay = agendaEvents.find(e => format(e.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
        if(eventOnDay) {
            const tx = transactions.find(t => t.id === eventOnDay.transactionId);
            if(tx) setSelectedTransaction(tx);
        }
    }


    const isModuleActive = currentUser.isTransactionsActive ?? false;
    
    const { reputation, effectiveness } = getUserMetrics(currentUser.id, transactions);

    const pendingTx = transactions.filter(t => {
        if (currentUser.type === 'provider') {
            return (t.providerId === currentUser.id && (
                t.status === 'Solicitud Pendiente' || 
                t.status === 'Acuerdo Aceptado - Pendiente de Ejecución' ||
                t.status === 'Cita Solicitada' ||
                t.status === 'Pago Enviado - Esperando Confirmación'
            ));
        } else {
            return (t.clientId === currentUser.id && (
                t.status === 'Cotización Recibida' || 
                t.status === 'Finalizado - Pendiente de Pago' ||
                t.status === 'Pendiente de Confirmación del Cliente'
            ));
        }
    });

    const historyTx = transactions.filter(t => t.status === 'Pagado' || t.status === 'Resuelto');
    const commitmentTx = transactions.filter(t => t.status === 'Acuerdo Aceptado - Pendiente de Ejecución' || t.status === 'Finalizado - Pendiente de Pago');
    
    const credicoraLevelDetails = credicoraLevels[(currentUser.credicoraLevel || 1).toString()];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            );
        }
        switch (view) {
            case 'pending':
                return <TransactionList title="Lista de Pendientes" transactions={pendingTx} onTransactionClick={setSelectedTransaction} />;
            case 'history':
                return <TransactionList title="Historial de Transacciones" transactions={historyTx} onTransactionClick={setSelectedTransaction} />;
            case 'commitments':
                return <TransactionList title="Compromisos de Pago" transactions={commitmentTx} onTransactionClick={setSelectedTransaction} />;
            case 'summary':
            default:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen de Movimientos</CardTitle>
                                <CardDescription>Últimos 6 meses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TransactionsLineChart transactions={transactions} />
                            </CardContent>
                        </Card>
                         
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>Progreso y Credicora</span>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600"/>
                                                Ver Pagos
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="multiple"
                                                selected={paymentDates}
                                                onDayClick={handleDayClick}
                                            />
                                            <div className="p-2 border-t text-center text-xs text-muted-foreground">
                                                Haz clic en una fecha para ver el detalle del pago.
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                               <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium"><span>Reputación</span><span>{reputation.toFixed(1)}/5.0</span></div>
                                        <Progress value={(reputation / 5) * 100} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium"><span>Efectividad</span><span>{effectiveness.toFixed(0)}%</span></div>
                                        <Progress value={effectiveness} />
                                    </div>
                                    <div className="space-y-1 pt-2 border-t">
                                        <div className="flex justify-between items-baseline text-xs font-medium">
                                            <Link href="/credicora" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> Nivel Credicora</Link>
                                            <span className="font-bold">{credicoraLevelDetails.level}: {credicoraLevelDetails.name}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium"><span>Límite de Crédito</span><span>${currentUser.credicoraLimit?.toFixed(2) || '0.00'}</span></div>
                                        <Progress value={((currentUser.credicoraLimit || 0) / credicoraLevelDetails.creditLimit) * 100} className="[&>div]:bg-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                           <CardContent className="p-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <ActionButton icon={ListChecks} label="Pendientes" count={pendingTx.length} onClick={() => setView('pending')} />
                                    <ActionButton icon={History} label="Historial" count={0} onClick={() => setView('history')} />
                                    <ActionButton icon={CalendarClock} label="Compromisos" count={commitmentTx.length} onClick={() => setView('commitments')} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        {!currentUser.isSubscribed && (
                            <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
                                <CardContent className="p-6 text-center">
                                <div className="mx-auto bg-primary/20 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                    <Star className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">¡Desbloquea tu Potencial!</h3>
                                <p className="text-muted-foreground mt-2 mb-4">
                                    Obtén tu insignia de verificado, llega a más clientes y accede a beneficios exclusivos.
                                </p>
                                <Button onClick={() => setIsSubscriptionDialogOpen(true)}>
                                    Ver Planes de Suscripción
                                </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
        }
    };
    
    return (
        <div className="bg-muted/20 min-h-screen">
            <TransactionsHeader onBackToSummary={() => setView('summary')} currentView={view} />
            <main className="container py-6">
                 {isModuleActive ? renderContent() : (
                    <div className="space-y-4">
                        <ActivationWarning userType={currentUser.type} />
                        <div className="text-center py-12 opacity-50">
                            <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold">Módulo Desactivado</h2>
                            <p className="mt-2 text-muted-foreground">Activa el módulo para ver tus finanzas.</p>
                        </div>
                    </div>
                )}
            </main>
            <TransactionDetailsDialog 
                isOpen={!!selectedTransaction}
                onOpenChange={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />
            <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
        </div>
    );
}
