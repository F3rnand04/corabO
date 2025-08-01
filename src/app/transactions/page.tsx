
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Home, Settings, Wallet, ShoppingCart, TrendingUp, Circle, Calendar, Bell, PieChart, Eye, EyeOff, Info, FileText, Banknote, ShieldAlert, Power, LogOut, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import TransactionsLineChart from "@/components/charts/TransactionsLineChart";
import TransactionsPieChart from "@/components/charts/TransactionsPieChart";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
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


function TransactionsHeader() {
    const router = useRouter();
    const { currentUser, deactivateTransactions, downloadTransactionsPDF } = useCorabo();
    const isModuleActive = currentUser.isTransactionsActive ?? false;
    const [isDeactivationAlertOpen, setIsDeactivationAlertOpen] = useState(false);

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
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <Home className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-lg font-semibold">Registro de Transacciones</h1>
                    </div>
                    <div className="flex items-center">
                       <Button variant="ghost" size="icon">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </Button>
                        
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
                                        <DropdownMenuItem>
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

const TransactionItem = ({ label, count, color, onClick }: { label: string; count: number; color: string; onClick: () => void; }) => (
    <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            <p className="font-medium">{label}</p>
        </div>
        <div className="flex items-center gap-3">
            {count > 0 && (
                <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {count}
                </div>
            )}
            <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
    </div>
);


export default function TransactionsPage() {
    const { transactions, currentUser } = useCorabo();
    const router = useRouter();
    const isModuleActive = currentUser.isTransactionsActive ?? false;
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [chartType, setChartType] = useState<'line' | 'pie'>('line');
    const [showSensitiveData, setShowSensitiveData] = useState(true);
    const { toast } = useToast();
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);


    const pendingCount = transactions.filter(t => t.status === 'Solicitud Pendiente').length;
    const paymentCommitmentsCount = transactions.filter(t => t.status === 'Acuerdo Aceptado - Pendiente de Ejecución').length;
    
    const paymentCommitmentDates = transactions
    .filter((tx: Transaction) => (tx.providerId === currentUser.id || tx.clientId === currentUser.id) && tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución')
    .map((tx: Transaction) => new Date(tx.date));

    const handleTransactionClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
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

    const navigateToSettings = () => {
        router.push('/transactions/settings');
    }
    
    return (
        <div className="bg-muted/20 min-h-screen">
            <TransactionsHeader />
            
            <main className="container py-6" onClick={handleInactiveClick}>
                 {isModuleActive ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                     <Button size="icon" variant={chartType === 'line' ? 'default' : 'secondary'} onClick={() => setChartType('line')}>
                                        <TrendingUp className="w-5 h-5"/>
                                    </Button>
                                     <Button size="icon" variant={chartType === 'pie' ? 'default' : 'secondary'} onClick={() => setChartType('pie')}>
                                        <PieChart className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {chartType === 'line' ? (
                                    <TransactionsLineChart transactions={transactions} />
                                ) : (
                                    <TransactionsPieChart transactions={transactions} />
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <p>NIVEL 1</p>
                                <p className="text-muted-foreground">ALFHA</p>
                            </div>
                            <Progress value={0} />
                        </div>
                        
                        <Card className="bg-card">
                           <CardHeader className="py-4 px-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">CREDICORA</CardTitle>
                                    <div className="text-right">
                                        <p className="text-xl font-bold">{showSensitiveData ? `$${(currentUser.credicoraLimit || 0).toFixed(2)}` : '$***,**'}</p>
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
                                                <CalendarComponent
                                                mode="multiple"
                                                selected={paymentCommitmentDates}
                                                disabled={(date) => date < new Date("1900-01-01")}
                                                initialFocus
                                                />
                                                <div className="p-2 border-t text-center text-xs text-muted-foreground">
                                                    Días con compromisos de pago resaltados.
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                    <div className="text-muted-foreground">USADO</div>
                                    <div className="font-semibold">{showSensitiveData ? '$0.00' : '$**,**'}</div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div className="text-muted-foreground">DISPONIBLE</div>
                                    <div className="font-semibold">{showSensitiveData ? `$${(currentUser.credicoraLimit || 0).toFixed(2)}` : '$***,**'}</p>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-4 space-y-2">
                                <TransactionItem
                                    label="Lista de Pendientes"
                                    count={pendingCount}
                                    color="bg-red-500"
                                    onClick={() => {
                                        const tx = transactions.find(t => t.status === 'Solicitud Pendiente');
                                        if(tx) handleTransactionClick(tx);
                                    }}
                                />
                                <TransactionItem
                                    label="Transacciones"
                                    count={0}
                                    color="bg-cyan-400"
                                    onClick={() => {
                                        const tx = transactions.find(t => t.status === 'Pagado');
                                        if(tx) handleTransactionClick(tx);
                                    }}
                                />
                                <TransactionItem
                                    label="Compromisos de Pagos"
                                    count={paymentCommitmentsCount}
                                    color="bg-red-500"
                                    onClick={() => {
                                        const tx = transactions.find(t => t.status === 'Acuerdo Aceptado - Pendiente de Ejecución');
                                        if(tx) handleTransactionClick(tx);
                                    }}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <h3 className="font-bold text-lg">¡Lleva tu perfil al siguiente nivel!</h3>
                                <p className="text-sm text-muted-foreground mt-1">Obtén tu insignia de verificado, mayor visibilidad, más crédito y mejores facilidades de pago.</p>
                                <Button className="mt-4" onClick={() => setIsSubscriptionDialogOpen(true)}>
                                    <Star className="mr-2 h-4 w-4"/>
                                    Ver Planes de Suscripción
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-20 cursor-pointer">
                        <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold">Módulo Desactivado</h2>
                        <p className="mt-2 text-muted-foreground">
                            Para ver tu registro de transacciones, activa el módulo desde el menú de Ajustes.
                        </p>
                        <Button className="mt-6" onClick={(e) => { e.stopPropagation(); navigateToSettings(); }}>
                            <Info className="w-4 h-4 mr-2"/>
                            Activar Módulo
                        </Button>
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

    