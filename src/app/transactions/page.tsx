
'use client';

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth-provider";
import { Home, Settings, Wallet, ListChecks, History, CalendarClock, ChevronLeft, Loader2, Star, TrendingUp, Calendar as CalendarIcon, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import type { Transaction } from "@/lib/types";
import { TransactionList } from "@/components/TransactionList";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Skeleton } from "@/components/ui/skeleton";
import { credicoraLevels, credicoraCompanyLevels } from "@/lib/types";
import Link from "next/link";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CheckoutAlertDialogContent } from "@/components/CheckoutAlertDialogContent";
import { CartPopoverContent } from "@/components/CartPopoverContent";


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
                        <Wallet className="h-6 h-6 text-muted-foreground" />
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
    const { currentUser, transactions, cart, getUserMetrics, isLoadingAuth } = useAuth();
    const router = useRouter();
    
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [view, setView] = useState<'summary' | 'pending' | 'history' | 'commitments'>('summary');
    
    // State for cart popover & dialog
    const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
    
    const isModuleActive = currentUser?.isTransactionsActive ?? false;

    // Memoize derived data to prevent re-calculations on every render
    const { 
        agendaEvents, 
        paymentDates, 
        totalCartItems, 
        pendingTx, 
        historyTx, 
        commitmentTx,
        reputation,
        effectiveness,
        credicoraLevelDetails,
        nextCredicoraLevelDetails,
        completedTransactionsCount,
        transactionsNeeded,
        progressToNextLevel
    } = useMemo(() => {
        if (!currentUser) {
            return {
                agendaEvents: [], paymentDates: [], totalCartItems: 0,
                pendingTx: [], historyTx: [], commitmentTx: [],
                reputation: 0, effectiveness: 0, credicoraLevelDetails: null,
                nextCredicoraLevelDetails: null, completedTransactionsCount: 0,
                transactionsNeeded: 1, progressToNextLevel: 0
            };
        }

        const isCompany = currentUser.profileSetupData?.providerType === 'company';
        const activeCredicoraLevels = isCompany ? credicoraCompanyLevels : credicoraLevels;
        
        const metrics = getUserMetrics(currentUser.id, currentUser.type, transactions);
        
        const events = transactions
            .filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status))
            .map(tx => ({
                date: new Date(tx.date),
                type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment',
                transactionId: tx.id,
            }));

        const dates = events.filter(e => e.type === 'payment').map(e => e.date);
        const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

        const pending = transactions.filter(t => {
            if (currentUser.type === 'provider') {
                return t.providerId === currentUser.id && ['Solicitud Pendiente', 'Acuerdo Aceptado - Pendiente de Ejecución', 'Cita Solicitada', 'Pago Enviado - Esperando Confirmación'].includes(t.status);
            }
            return t.clientId === currentUser.id && ['Cotización Recibida', 'Finalizado - Pendiente de Pago', 'Pendiente de Confirmación del Cliente'].includes(t.status);
        });

        const history = transactions.filter(t => ['Pagado', 'Resuelto'].includes(t.status));
        const commitments = transactions.filter(t => ['Acuerdo Aceptado - Pendiente de Ejecución', 'Finalizado - Pendiente de Pago'].includes(t.status));
        
        const credicoraLvl = activeCredicoraLevels[(currentUser.credicoraLevel || 1).toString()];
        const nextCredicoraLvl = activeCredicoraLevels[((currentUser.credicoraLevel || 1) + 1).toString()];
        const completedCount = transactions.filter(tx => tx.clientId === currentUser.id && ['Pagado', 'Resuelto'].includes(tx.status)).length;
        const needed = credicoraLvl?.transactionsForNextLevel ?? 1;
        const progress = (completedCount / needed) * 100;

        return {
            agendaEvents: events, paymentDates: dates, totalCartItems: cartTotal,
            pendingTx: pending, historyTx: history, commitmentTx: commitments,
            reputation: metrics.reputation, effectiveness: metrics.effectiveness,
            credicoraLevelDetails: credicoraLvl, nextCredicoraLevelDetails: nextCredicoraLvl,
            completedTransactionsCount: completedCount, transactionsNeeded: needed, progressToNextLevel: progress
        };
    }, [currentUser, transactions, cart, getUserMetrics]);


    if (isLoadingAuth || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleDayClick = (day: Date) => {
        const eventOnDay = agendaEvents.find(e => format(e.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
        if(eventOnDay) {
            const tx = transactions.find(t => t.id === eventOnDay.transactionId);
            if(tx) setSelectedTransaction(tx);
        }
    }
    
    const renderContent = () => {
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
                                <CardTitle className="flex items-center gap-2">
                                     <Star className="w-6 h-6 text-blue-500 fill-blue-500"/>
                                     Mi Credicora
                                </CardTitle>
                                 <CardDescription>Tu motor de crecimiento en Corabo.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               {credicoraLevelDetails && <div className="space-y-1">
                                    <div className="flex justify-between items-baseline text-sm font-medium">
                                        <span className="text-muted-foreground">Nivel {credicoraLevelDetails.level}</span>
                                        <span className="font-bold text-lg text-foreground">{credicoraLevelDetails.name}</span>
                                    </div>
                               </div>}
                                {credicoraLevelDetails && <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>Límite de Crédito</span>
                                        <span>${(currentUser.credicoraLimit || 0).toLocaleString()} / ${credicoraLevelDetails.creditLimit.toLocaleString()}</span>
                                    </div>
                                    <Progress value={((currentUser.credicoraLimit || 0) / credicoraLevelDetails.creditLimit) * 100} className="h-2 [&>div]:bg-blue-500" />
                                </div>}
                                {nextCredicoraLevelDetails && (
                                     <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Próximo Nivel: {nextCredicoraLevelDetails.name}</span>
                                            <span>{completedTransactionsCount} / {transactionsNeeded} transacciones</span>
                                        </div>
                                        <Progress value={progressToNextLevel} className="h-2" />
                                    </div>
                                )}
                                <div className="text-right">
                                    <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
                                        <Link href="/credicora">Saber más</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>Mi Reputación</span>
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
                                        <div className="flex justify-between text-xs font-medium"><span>Reputación (Estrellas)</span><span>{reputation.toFixed(1)}/5.0</span></div>
                                        <Progress value={(reputation / 5) * 100} className="h-2" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium"><span>Efectividad</span><span>{effectiveness.toFixed(0)}%</span></div>
                                        <Progress value={effectiveness} className="h-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                           <CardContent className="p-2">
                                <div className="grid grid-cols-4 gap-2">
                                    <ActionButton icon={ListChecks} label="Pendientes" count={pendingTx.length} onClick={() => setView('pending')} />
                                    <ActionButton icon={History} label="Historial" count={0} onClick={() => setView('history')} />
                                    <ActionButton icon={CalendarClock} label="Compromisos" count={commitmentTx.length} onClick={() => setView('commitments')} />
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                                <Button variant="outline" className="flex flex-col h-24 w-full items-center justify-center gap-1 relative">
                                                {totalCartItems > 0 && <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{totalCartItems}</span>}
                                                <ShoppingCart className="w-8 h-8 text-primary" />
                                                <span className="text-xs text-center">Carrito</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <CartPopoverContent onCheckoutClick={() => setIsCheckoutAlertOpen(true)} />
                                        </PopoverContent>
                                    </Popover>
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
                 {!isModuleActive ? (
                    <div className="space-y-4">
                        <ActivationWarning userType={currentUser.type} />
                        <div className="text-center py-12">
                            <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold">Módulo Desactivado</h2>
                            <p className="mt-2 text-muted-foreground">Activa el módulo para ver tus finanzas.</p>
                            <Button className="mt-4" onClick={() => router.push('/transactions/settings')}>Activar Módulo</Button>
                        </div>
                    </div>
                ) : renderContent()}
            </main>
            <TransactionDetailsDialog 
                isOpen={!!selectedTransaction}
                onOpenChange={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />
            <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
             <CheckoutAlertDialogContent onOpenChange={setIsCheckoutAlertOpen} />
        </div>
    );
}
