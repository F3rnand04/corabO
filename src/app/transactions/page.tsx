
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Home, Settings, Wallet, ListChecks, History, CalendarClock, ChevronLeft, ChevronDown, CheckCircle, TrendingDown, Loader2 } from "lucide-react";
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
import { TransactionList } from "@/components/TransactionList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Day, type DayProps } from 'react-day-picker';
import { cn } from "@/lib/utils";
import { credicoraLevels } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ActivationWarning } from "@/components/ActivationWarning";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Unsubscribe } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


function TransactionsHeader({ onBackToSummary, currentView }: { onBackToSummary: () => void, currentView: string }) {
    const router = useRouter();
    const { currentUser, deactivateTransactions, downloadTransactionsPDF } = useCorabo();
    const isModuleActive = currentUser?.isTransactionsActive ?? false;
    const [isDeactivationAlertOpen, setIsDeactivationAlertOpen] = useState(false);
    
    // Este estado es local al header, no necesita estar en el contexto principal
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        const db = getFirestoreDb();
        const txQuery = query(collection(db, 'transactions'), where('participantIds', 'array-contains', currentUser.id));
        const unsubscribe = onSnapshot(txQuery, (snapshot) => {
            const serverTransactions = snapshot.docs.map(doc => {
                const data = doc.data() as Transaction;
                // Pre-process to ensure serializability if needed, though this component doesn't pass it down
                return {
                    ...data,
                    date: new Date(data.date).toISOString(), // Example of ensuring date is a string
                };
            });
            setTransactions(serverTransactions);
        });
        return () => unsubscribe();
    }, [currentUser]);


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
                                        {/* ... Dropdown items ... */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    {/* ... Alert Dialog content ... */}
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
    const { currentUser, getAgendaEvents, getUserMetrics } = useCorabo();
    const { toast } = useToast();
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
                 // CRITICAL FIX: Ensure all date fields are serializable strings
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
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>Resumen de Movimientos</CardTitle>
                                {/* Chart controls can go here */}
                            </CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center">
                                <TransactionsPieChart transactions={transactions} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Progreso</CardTitle>
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
        </div>
    );
}

    