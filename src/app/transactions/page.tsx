
"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import TransactionsChart from '@/components/charts/TransactionsChart';

const TransactionItem = ({ status, color, amount }: { status: string; color: string; amount: string }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <p className="font-bold">Multimax</p>
            <p className="text-xs text-muted-foreground">Tv.32"</p>
            <p className="text-xs text-muted-foreground">Monto: 105,00</p>
            <p className="text-xs text-muted-foreground">Pagado: 60,00</p>
            <p className="text-xs text-muted-foreground">Próximo pago: 21/05/2025</p>
            <Link href="#" className="text-xs text-primary hover:underline">Más detalles</Link>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg">{amount}</p>
            <p className="text-xs text-muted-foreground">Monto</p>
            <Button size="sm" className={`mt-2 rounded-full h-8 ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} text-white hover:bg-opacity-80`}>
                Abonar
            </Button>
        </div>
    </div>
);


export default function TransactionsPage() {
    const { currentUser, transactions } = useCorabo();

    return (
        <main className="container py-4">
             <div className="flex items-center justify-start mb-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
            </div>
            
            <Card className="mb-6">
                <CardContent>
                    <TransactionsChart transactions={transactions} />
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Historial de Transacciones</h2>

            <Card className="bg-card border rounded-2xl shadow-sm">
                <CardContent className="p-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                        <TransactionItem status="En uso" color="green" amount="00,00" />
                        <Separator/>
                        <TransactionItem status="En uso" color="red" amount="00,00" />
                        <Separator/>
                        <TransactionItem status="En uso" color="green" amount="00,00" />
                        <Separator/>
                        <TransactionItem status="En uso" color="green" amount="00,00" />
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
