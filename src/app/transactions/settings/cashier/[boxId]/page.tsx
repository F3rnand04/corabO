'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, DollarSign, List, BarChart } from 'lucide-react';
import { TransactionList } from '@/components/TransactionList';
import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/types';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';

function CashierDetailsHeader({ boxName }: { boxName: string }) {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/transactions/settings/cashier')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex items-center gap-2">Detalles de Caja: {boxName}</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function CashierDetailsPage() {
    const params = useParams();
    const { currentUser, transactions } = useCorabo();
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const boxId = params.boxId as string;
    
    const box = useMemo(() => {
        return currentUser?.profileSetupData?.cashierBoxes?.find(b => b.id === boxId);
    }, [currentUser, boxId]);
    
    const boxTransactions = useMemo(() => {
        return transactions.filter(tx => tx.details.cashierBoxId === boxId);
    }, [transactions, boxId]);
    
    const totalCollected = useMemo(() => {
        return boxTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    }, [boxTransactions]);
    
    const averageTransaction = useMemo(() => {
        if (boxTransactions.length === 0) return 0;
        return totalCollected / boxTransactions.length;
    }, [boxTransactions, totalCollected]);


    if (!box) {
        return <div>Caja no encontrada.</div>;
    }

    return (
        <>
            <CashierDetailsHeader boxName={box.name} />
            <main className="container py-8 max-w-4xl mx-auto space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Recaudado" value={`$${totalCollected.toFixed(2)}`} icon={DollarSign} />
                    <StatCard title="Total de Transacciones" value={boxTransactions.length.toString()} icon={List} />
                    <StatCard title="Promedio por Transacción" value={`$${averageTransaction.toFixed(2)}`} icon={BarChart} />
                </div>
                
                <TransactionList 
                    title="Historial de Transacciones de la Caja" 
                    transactions={boxTransactions}
                    onTransactionClick={setSelectedTransaction}
                />
            </main>
            <TransactionDetailsDialog 
                isOpen={!!selectedTransaction}
                onOpenChange={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />
        </>
    );
}
