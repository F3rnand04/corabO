

'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Home, Settings, Wallet, ShoppingCart, TrendingUp, PieChart, Eye, EyeOff, Calendar, Info, FileText, Banknote, ShieldAlert, LogOut, Star, Plus, Minus, X, Truck, ListChecks, History, CalendarClock, ChevronLeft, ChevronDown, CheckCircle, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import TransactionsLineChart from "@/components/charts/TransactionsLineChart";
import TransactionsPieChart from "@/components/charts/TransactionsPieChart";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import type { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TransactionList } from "@/components/TransactionList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Day, type DayProps } from 'react-day-picker';
import { cn } from "@/lib/utils";
import { credicoraLevels } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ActivationWarning } from "@/components/ActivationWarning";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


function TransactionsHeader({ onBackToSummary, currentView }: { onBackToSummary: () => void, currentView: string }) {
    const router = useRouter();
    const { currentUser, deactivateTransactions, downloadTransactionsPDF } = useCorabo();
    const isModuleActive = currentUser?.isTransactionsActive ?? false;
    const [isDeactivationAlertOpen, setIsDeactivationAlertOpen] = useState(false);
    
    if (!currentUser) return null;

    const handleDeactivation = () => {
        deactivateTransactions(currentUser.id);
        setIsDeactivationAlertOpen(false);
    };

    const navigateToSettings = () => {
        router.push('/transactions/settings');
    }

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
                    <div className="flex items-center">
                        {isModuleActive ? (
                            <AlertDialog open={isDeactivationAlertOpen} onOpenChange={setIsDeactivationAlertOpen}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Settings className="h-6 w-6 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ajustes de Registro</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={downloadTransactionsPDF}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>Imprimir Registro (PDF)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={navigateToSettings}>
                                            <Banknote className="mr-2 h-4 w-4" />
                                            <span>Modificar Datos de Pago</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/policies')}>
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            <span>Ver Políticas de Registro</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                             <DropdownMenuItem 
                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Desactivar Registro</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro de desactivar tu registro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Al desactivar el módulo de transacciones, se pausará el cálculo de tu reputación y efectividad. Podrás reactivarlo en cualquier momento, pero deberás completar el proceso de verificación de nuevo.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeactivation} className="bg-destructive hover:bg-destructive/90">Desactivar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={navigateToSettings}>
                                <Settings className="h-6 w-6 text-green-500 animate-pulse" />
                            </Button>
                        )}

                    </div>
                </div>
            </div>
        </header>
    );
}

const ActionButton = ({ icon: Icon, label, count, onClick }: { icon: React.ElementType, label: string, count: number, onClick: () => void }) => (
    <Button variant="outline" className="flex flex-col h-24 w-full items-center justify-center gap-1 relative" onClick={onClick}>
        {count > 0 && <Badge variant="destructive" className="absolute top-2 right-2">{count}</Badge>}
        <Icon className="w-8 h-8 text-primary" />
        <span className="text-xs text-center">{label}</span>
    </Button>
);


export default function TransactionsPage() {
    const { currentUser, getAgendaEvents, getUserMetrics, subscribeUser } = useCorabo();
    const router = useRouter();
    const { toast } = useToast();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [chartType, setChartType] = useState<'line' | 'pie'>('line');
    const [showSensitiveData, setShowSensitiveData] = useState(true);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [view, setView] = useState<'summary' | 'pending' | 'history' | 'commitments'>('summary');
    const [isProgressionOpen, setIsProgressionOpen] = useState(false);

    useEffect(() => {
        if (!currentUser?.isTransactionsActive) {
            setIsLoading(false);
            return;
        }
        if (!currentUser) return;

        const db = getFirestoreDb();
        const q = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las transacciones.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }

    const isModuleActive = currentUser.isTransactionsActive ?? false;
    const isProvider = currentUser.type === 'provider';
    
    const agendaEvents = getAgendaEvents();
    const userCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];

    // Calculate used credit
    const usedCredit = transactions.filter(tx => 
        tx.clientId === currentUser.id && 
        tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && 
        tx.details.system?.includes('Cuota')
    ).reduce((sum, tx) => sum + tx.amount, 0);

    const availableCredit = (currentUser.credicoraLimit || 0) - usedCredit;
    const { effectiveness, reputation } = getUserMetrics(currentUser.id);


    // Placeholder data for progression
    const completedTransactions = transactions.filter(t => (t.clientId === currentUser.id || t.providerId === currentUser.id) && (t.status === 'Pagado' || t.status === 'Resuelto')).length;
    const transactionsForNextLevel = credicoraDetails.transactionsForNextLevel || 25;
    
    const onDayDoubleClick = (day: Date) => {
        const eventOnDay = agendaEvents.find(
            e => new Date(e.date).toDateString() === day.toDateString()
        );
        if (eventOnDay) {
            const tx = transactions.find(t => t.id === eventOnDay.transactionId);
            if(tx){
              if (eventOnDay.type === 'payment') {
                  setView('commitments');
              } else {
                  setView('pending');
              }
              setSelectedTransaction(tx);
            }
        }
    };


    const pendingTx = transactions.filter(t => {
        if (isProvider) {
            return (t.providerId === currentUser.id && (
                t.status === 'Solicitud Pendiente' || 
                t.status === 'Acuerdo Aceptado - Pendiente de Ejecución' ||
                t.status === 'Cita Solicitada' ||
                t.status === 'Pago Enviado - Esperando Confirmación'
            ));
        } else { // isClient
            return (t.clientId === currentUser.id && (
                t.status === 'Cotización Recibida' || 
                t.status === 'Finalizado - Pendiente de Pago' ||
                t.status === 'Pendiente de Confirmación del Cliente'
            ));
        }
    });

    const historyTx = transactions.filter(t => (t.providerId === currentUser.id || t.clientId === currentUser.id) && (t.status === 'Pagado' || t.status === 'Resuelto'));
    
    const commitmentTx = transactions.filter(t => (t.providerId === currentUser.id || t.clientId === currentUser.id) && 
        (t.status === 'Acuerdo Aceptado - Pendiente de Ejecución' || t.status === 'Finalizado - Pendiente de Pago'));
    
    const paymentCommitmentDates = agendaEvents.filter(e => e.type === 'payment').map(e => new Date(e.date));
    const taskDates = agendaEvents.filter(e => e.type === 'task').map(e => new Date(e.date));


    const handleTransactionClick = (transaction: Transaction) => {
        // Provider specific action
        if (isProvider && transaction.status === 'Pago Enviado - Esperando Confirmación') {
            setSelectedTransaction(transaction); // Open dialog to confirm
        } else {
            setSelectedTransaction(transaction);
        }
    }

    const handleInactiveClick = () => {
        if (!isModuleActive) {
            toast({
                title: "¡Activa tu Registro de Transacciones!",
                description: "Haz clic en el ícono de engranaje para empezar a llevar el control de tus finanzas.",
                action: <Settings className="w-5 h-5 text-green-500"/>
            });
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            )
        }

        switch (view) {
            case 'pending':
                return <TransactionList title="Lista de Pendientes" transactions={pendingTx} onTransactionClick={handleTransactionClick} />;
            case 'history':
                return <TransactionList title="Historial de Transacciones" transactions={historyTx} onTransactionClick={handleTransactionClick} />;
            case 'commitments':
                return <TransactionList title="Compromisos de Pago" transactions={commitmentTx} onTransactionClick={handleTransactionClick} />;
            case 'summary':
            default:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>Resumen de Movimientos</CardTitle>
                                <div className="flex items-center gap-2">
                                     <Button size="icon" variant={chartType === 'line' ? 'default' : 'secondary'} onClick={() => setChartType('line')}>
                                        <TrendingUp className="w-5 h-5"/>
                                    </Button>
                                     <Button size="icon" variant={chartType === 'pie' ? 'default' : 'secondary'} onClick={() => setChartType('pie')}>
                                        <PieChart className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center">
                                {chartType === 'line' ? (
                                    <TransactionsLineChart transactions={transactions} />
                                ) : (
                                    <TransactionsPieChart transactions={transactions} />
                                )}
                            </CardContent>
                        </Card>

                        <Collapsible open={isProgressionOpen} onOpenChange={setIsProgressionOpen}>
                            <Card>
                                <CollapsibleTrigger asChild>
                                    <div className="flex justify-between items-center p-4 cursor-pointer">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">NIVEL {credicoraDetails.level} - {credicoraDetails.name.toUpperCase()}</p>
                                            <Progress value={(completedTransactions / transactionsForNextLevel) * 100} className="w-40 h-2" />
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Ver Progresión
                                            <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isProgressionOpen && "rotate-180")} />
                                        </Button>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="p-4 pt-0 space-y-4">
                                        <Separator/>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium"><span>Reputación</span><span>{reputation.toFixed(1)}/5.0</span></div>
                                                <Progress value={(reputation / 5) * 100} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium"><span>Efectividad</span><span>{effectiveness.toFixed(0)}%</span></div>
                                                <Progress value={effectiveness} />
                                            </div>
                                            <div className="space-y-1">
                                                 <div className="flex justify-between text-xs font-medium"><span>Transacciones para Nivel {credicoraDetails.level + 1}</span><span>{completedTransactions}/{transactionsForNextLevel}</span></div>
                                                <Progress value={(completedTransactions / transactionsForNextLevel) * 100} />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-md text-center">
                                             <p className="text-sm font-semibold">¡Sigue así para desbloquear más crédito y mejores beneficios!</p>
                                             <Button size="sm" className="mt-2" onClick={() => setIsSubscriptionDialogOpen(true)}>
                                                <Star className="w-4 h-4 mr-2"/>
                                                Suscríbete para acelerar
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                        
                        <Card className="bg-card">
                           <CardHeader className="py-4 px-4">
                                <div className="flex justify-between items-start">
                                    <Link href="/credicora" className="cursor-pointer group">
                                        <CardTitle className="text-lg text-blue-600 group-hover:underline flex items-center gap-1">
                                            <Star className="w-5 h-5 fill-current"/>
                                            CREDICORA
                                        </CardTitle>
                                    </Link>
                                    <div className="text-right">
                                        <p className="text-xl font-bold">{showSensitiveData ? `$${(currentUser.credicoraLimit || 0).toFixed(2)}` : '$***.**'}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setShowSensitiveData(!showSensitiveData); }}>
                                            {showSensitiveData ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Calendar className="w-4 h-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <TooltipProvider>
                                                    <CalendarComponent
                                                        mode="multiple"
                                                        selected={[...paymentCommitmentDates, ...taskDates]}
                                                        onDayDoubleClick={onDayDoubleClick}
                                                        disabled={(date) => date < new Date("1900-01-01")}
                                                        initialFocus
                                                        components={{
                                                            Day: (props: DayProps) => {
                                                                const eventOnDay = agendaEvents.find(
                                                                    (e) => new Date(e.date).toDateString() === props.date.toDateString()
                                                                );
                                                                
                                                                return (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="relative w-full h-full flex items-center justify-center">
                                                                                <Day {...props} />
                                                                                {eventOnDay && (
                                                                                    <div className={cn(
                                                                                        "absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full",
                                                                                         eventOnDay.type === 'payment' ? 'bg-yellow-400' : 'bg-blue-400'
                                                                                    )} />
                                                                                )}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        {eventOnDay && (
                                                                            <TooltipContent>
                                                                                <p>{eventOnDay.description}</p>
                                                                            </TooltipContent>
                                                                        )}
                                                                    </Tooltip>
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TooltipProvider>
                                                 <div className="p-2 border-t text-center text-xs text-muted-foreground">
                                                     Doble clic en un día para ver detalles.
                                                 </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                    <div className="text-muted-foreground">USADO</div>
                                    <div className="font-semibold">{showSensitiveData ? `$${usedCredit.toFixed(2)}` : '$**.**'}</div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div className="text-muted-foreground">DISPONIBLE</div>
                                    <div className="font-semibold">{showSensitiveData ? `$${availableCredit.toFixed(2)}` : '$***.**'}</div>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <ActionButton 
                                        icon={ListChecks} 
                                        label="Lista de Pendientes"
                                        count={pendingTx.length}
                                        onClick={() => setView('pending')}
                                    />
                                    <ActionButton 
                                        icon={History} 
                                        label="Transacciones"
                                        count={0}
                                        onClick={() => setView('history')}
                                    />
                                    <ActionButton 
                                        icon={CalendarClock} 
                                        label="Compromisos de Pagos"
                                        count={commitmentTx.length}
                                        onClick={() => setView('commitments')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        
                    </div>
                );
        }
    }
    
    return (
        <div className="bg-muted/20 min-h-screen">
            <TransactionsHeader onBackToSummary={() => setView('summary')} currentView={view} />
            
            <main className="container py-6" onClick={handleInactiveClick}>
                 {isModuleActive ? renderContent() : (
                    <div className="space-y-4">
                        <ActivationWarning userType={currentUser.type} />
                        <div className="text-center py-12 cursor-pointer opacity-50">
                            <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold">Módulo Desactivado</h2>
                            <p className="mt-2 text-muted-foreground">
                                Activa el módulo para ver tu registro de transacciones.
                            </p>
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
    

    

    