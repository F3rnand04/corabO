
'use client';

import type { Transaction, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/hooks/use-auth-provider";
import { TransactionItem } from "./TransactionItem";


interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}


export function TransactionList({ title, transactions, onTransactionClick }: TransactionListProps) {
  const { currentUser, users } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map(tx => {
               if (!currentUser) return null;
               const otherPartyId = tx.providerId === currentUser.id ? tx.clientId : tx.providerId;
               const otherParty = users.find(u => u.id === otherPartyId) || null;
               return (
                    <TransactionItem 
                        key={tx.id} 
                        transaction={tx} 
                        otherParty={otherParty} 
                        onClick={onTransactionClick} 
                    />
               )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No hay transacciones en esta vista.</p>
        )}
      </CardContent>
    </Card>
  );
}
