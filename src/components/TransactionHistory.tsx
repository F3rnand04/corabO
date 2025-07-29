
"use client";

import type { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentUserId: string;
  onTransactionClick: (transaction: Transaction) => void;
}

const TransactionHistoryItem = ({ transaction, isIncome, onClick }: { transaction: Transaction; isIncome: boolean; onClick: () => void }) => {
    
    const description = 
        transaction.type === 'Compra' ? 'Compra de productos' :
        transaction.type === 'Servicio' ? `Servicio: ${transaction.details.serviceName}` :
        transaction.details.system || 'Transacción del sistema';

    return (
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors" onClick={onClick}>
            <div className="flex items-center gap-4">
                {isIncome ? (
                    <ArrowUpCircle className="w-6 h-6 text-green-500" />
                ) : (
                    <ArrowDownCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                    <p className="font-semibold">{description}</p>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
            </div>
            <p className={cn("font-bold text-lg", isIncome ? "text-green-600" : "text-red-600")}>
                {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
            </p>
        </div>
    )
}


export function TransactionHistory({ transactions, currentUserId, onTransactionClick }: TransactionHistoryProps) {
    const completedTransactions = transactions
        .filter(tx => ['Pagado', 'Resuelto', 'Recarga'].includes(tx.status))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
                {completedTransactions.length > 0 ? (
                    <div className="space-y-2">
                        {completedTransactions.map(tx => {
                            // Logic to determine if it's income or expense
                            // If current user is provider, a service/sale is income.
                            // If current user is client, a service/sale is expense.
                            // A 'Recarga' is always income for the client.
                            let isIncome = false;
                            if (tx.type === 'Sistema' && tx.status === 'Recarga') {
                                isIncome = true;
                            } else if (tx.providerId === currentUserId) {
                                isIncome = true; // It's a payment to me (provider)
                            }

                            return (
                                <TransactionHistoryItem 
                                    key={tx.id} 
                                    transaction={tx} 
                                    isIncome={isIncome}
                                    onClick={() => onTransactionClick(tx)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No hay transacciones completadas para mostrar.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
