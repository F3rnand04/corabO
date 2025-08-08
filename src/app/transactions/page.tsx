

'use client';

import { useState } from "react";
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


function TransactionsHeader({ onBackToSummary, currentView }: { onBackToSummary: () => void, currentView: string }) {
    const router = useRouter();
    const { currentUser, users, deactivateTransactions, downloadTransactionsPDF, cart, updateCartQuantity, getCartTotal, checkout, getDeliveryCost } = useCorabo();
    const isModuleActive = currentUser.isTransactionsActive ?? false;
    const [isDeactivationAlertOpen, setIsDeactivationAlertOpen] = useState(false);
    const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
    const [includeDelivery, setIncludeDelivery] = useState(false);
    const [useCredicora, setUseCredicora] = useState(false);
    
    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleDeactivation = () => {
        deactivateTransactions(currentUser.id);
        setIsDeactivationAlertOpen(false);
    };

    const navigateToSettings = () => {
        router.push('/transactions/settings');
    }

    const subtotal = getCartTotal();
    const deliveryCost = getDeliveryCost();

    const cartTransaction = cart.length > 0 ? currentUser.transactions?.find(tx => tx.status === 'Carrito Activo' && tx.clientId === currentUser.id) : undefined;
    const provider = users.find(u => u.id === cartTransaction?.providerId);
    
    const isDeliveryOnly = provider?.profileSetupData?.isOnlyDelivery || false;
    const providerAcceptsCredicora = provider?.profileSetupData?.acceptsCredicora || false;

    const totalWithDelivery = subtotal + ((includeDelivery || isDeliveryOnly) ? deliveryCost : 0);
    
    const userCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
    const creditLimit = currentUser.credicoraLimit || 0;
    
    // New calculation logic
    const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
    const potentialFinancing = subtotal * financingPercentage; // Financing only on products
    const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
    const productInitialPayment = subtotal - financedAmount;
    const totalToPayToday = productInitialPayment + ((includeDelivery || isDeliveryOnly) ? deliveryCost : 0);
    const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;


    const handleCheckout = () => {
      if (cartTransaction) {
          checkout(cartTransaction.id, includeDelivery || isDeliveryOnly, useCredicora);
          setIsCheckoutAlertOpen(false);
          setUseCredicora(false);
      }
    };
    
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
                       <AlertDialog open={isCheckoutAlertOpen} onOpenChange={setIsCheckoutAlertOpen}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="w-5 w-5 text-muted-foreground" />
                                {totalCartItems > 0 && (
                                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">{totalCartItems}</Badge>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Carrito de Compras</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Resumen de tu pedido global.
                                    </p>
                                </div>
                                    {cart.length > 0 ? (
                                    <>
                                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                                            <Link href={`/companies/${item.product.providerId}`} className="cursor-pointer hover:underline">
                                                <p className="font-medium text-sm truncate">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                                            </Link>
                                            <div className="flex items-center gap-1 border rounded-md">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => updateCartQuantity(item.product.id, 0)}>
                                              <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>Total:</span>
                                        <span>${getCartTotal().toFixed(2)}</span>
                                    </div>
                                    <AlertDialogTrigger asChild>
                                      <Button className="w-full">Ver Pre-factura</Button>
                                    </AlertDialogTrigger>
                                    </>
                                    ) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Revisa tu pedido. Puedes incluir el costo de envío y pagar con Credicora si está disponible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-4">
                               <div className="flex justify-between text-sm">
                                   <span>Subtotal:</span>
                                   <span className="font-semibold">${subtotal.toFixed(2)}</span>
                               </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="delivery-switch" className="flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Incluir Delivery
                                    </Label>
                                    <Switch
                                        id="delivery-switch"
                                        checked={includeDelivery || isDeliveryOnly}
                                        onCheckedChange={setIncludeDelivery}
                                        disabled={isDeliveryOnly}
                                    />
                                </div>
                                {isDeliveryOnly && <p className="text-xs text-muted-foreground -mt-2">Este proveedor solo trabaja con delivery.</p>}
                                <div className="flex justify-between text-sm">
                                   <span>Costo de envío (aprox):</span>
                                   <span className="font-semibold">${(includeDelivery || isDeliveryOnly) ? deliveryCost.toFixed(2) : '0.00'}</span>
                               </div>

                                {providerAcceptsCredicora && (
                                     <div className="flex items-center justify-between pt-2 border-t mt-2">
                                        <Label htmlFor="credicora-switch" className="flex items-center gap-2 text-blue-600 font-semibold">
                                            <Star className="w-4 h-4 fill-current"/>
                                            Pagar con Credicora
                                        </Label>
                                        <Switch
                                            id="credicora-switch"
                                            checked={useCredicora}
                                            onCheckedChange={setUseCredicora}
                                        />
                                    </div>
                                )}
                               
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                   <span>Total a Pagar Hoy:</span>
                                   <span>${useCredicora ? totalToPayToday.toFixed(2) : totalWithDelivery.toFixed(2)}</span>
                               </div>
                                {useCredicora && financedAmount > 0 && (
                                    <p className="text-xs text-muted-foreground -mt-2 text-right">
                                        y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCheckout}>Pagar Ahora</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                       </AlertDialog>
                        
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

const ActionButton = ({ icon: Icon, label, count, onClick }: { icon: React.ElementType, label: string, count: number, onClick: () => void }) => (
    <Button variant="outline" className="flex flex-col h-24 w-full items-center justify-center gap-1 relative" onClick={onClick}>
        {count > 0 && <Badge variant="destructive" className="absolute top-2 right-2">{count}</Badge>}
        <Icon className="w-8 h-8 text-primary" />
        <span className="text-xs text-center">{label}</span>
    </Button>
);


export default function TransactionsPage() {
    const { transactions, currentUser, getAgendaEvents, confirmPaymentReceived, getUserEffectiveness } = useCorabo();
    const router = useRouter();
    const isModuleActive = currentUser.isTransactionsActive ?? false;
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [chartType, setChartType] = useState<'line' | 'pie'>('line');
    const [showSensitiveData, setShowSensitiveData] = useState(true);
    const { toast } = useToast();
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [view, setView] = useState<'summary' | 'pending' | 'history' | 'commitments'>('summary');
    const [isProgressionOpen, setIsProgressionOpen] = useState(false);

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
    const userEffectiveness = getUserEffectiveness(currentUser.id);


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

    const navigateToSettings = () => {
        router.push('/transactions/settings');
    }

    const renderContent = () => {
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
                                                <div className="flex justify-between text-xs font-medium"><span>Reputación</span><span>{currentUser.reputation.toFixed(1)}/5.0</span></div>
                                                <Progress value={(currentUser.reputation / 5) * 100} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium"><span>Efectividad</span><span>{userEffectiveness.toFixed(0)}%</span></div>
                                                <Progress value={userEffectiveness} />
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
                        </Card>
                        
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
                )
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
