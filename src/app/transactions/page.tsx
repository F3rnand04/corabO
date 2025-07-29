
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { ChevronLeft, Settings, Wallet, ShoppingCart, TrendingUp, Circle, Calendar, Bell, PieChart } from "lucide-react";
import { useRouter } from "next/navigation";
import TransactionsBarChart from "@/components/charts/TransactionsBarChart";
import TransactionsPieChart from "@/components/charts/TransactionsPieChart";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";


function TransactionsHeader({ onSettingsClick }: { onSettingsClick: () => void }) {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-lg font-semibold">Registro de Transacciones</h1>
                    </div>
                    <div className="flex items-center">
                       <Button variant="ghost" size="icon">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                            <Settings className="h-6 w-6 text-muted-foreground" />
                        </Button>
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
    const [isModuleActive, setIsModuleActive] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    const pendingCount = transactions.filter(t => t.status === 'Solicitud Pendiente').length;
    const paymentCommitmentsCount = transactions.filter(t => t.status === 'Acuerdo Aceptado - Pendiente de Ejecución').length;

    const handleTransactionClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    }
    
    return (
        <div className="bg-muted/20 min-h-screen">
            <TransactionsHeader onSettingsClick={() => setIsModuleActive(prev => !prev)} />
            
            <main className="container py-6">
                 {isModuleActive ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                     <Button size="icon" variant={chartType === 'bar' ? 'default' : 'secondary'} onClick={() => setChartType('bar')}>
                                        <TrendingUp className="w-5 h-5"/>
                                    </Button>
                                     <Button size="icon" variant={chartType === 'pie' ? 'default' : 'secondary'} onClick={() => setChartType('pie')}>
                                        <PieChart className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {chartType === 'bar' ? (
                                    <TransactionsBarChart transactions={transactions} />
                                ) : (
                                    <TransactionsPieChart transactions={transactions} />
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <p>NIVEL 1</p>
                                <p className="text-primary">ALFHA</p>
                            </div>
                            <Progress value={33} />
                        </div>
                        
                        <Card className="bg-card">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>CREDICORA</CardTitle>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">150,00$</p>
                                    </div>
                                    <div>
                                        <Calendar className="w-6 h-6 text-muted-foreground ml-2" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm pt-4">
                                    <div className="text-muted-foreground">USADO</div>
                                    <div className="font-semibold">00,00$</div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <div className="text-muted-foreground">DISPONIBLE</div>
                                    <div className="font-semibold">150,00$</div>
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
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold">Módulo Desactivado</h2>
                        <p className="mt-2 text-muted-foreground">
                            Para ver tu registro de transacciones, activa el módulo desde el menú de Ajustes.
                        </p>
                        <Button className="mt-6" onClick={() => setIsModuleActive(true)}>
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
        </div>
    );
}
