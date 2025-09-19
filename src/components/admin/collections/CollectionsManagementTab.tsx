
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Handshake, Phone, Mail, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/actions/messaging.actions';
import { useAuth } from '@/hooks/use-auth-provider';

interface CollectionsManagementTabProps {
  selectedCountry: string | null;
}

export function CollectionsManagementTab({ selectedCountry }: CollectionsManagementTabProps) {
  const { currentUser, users, transactions } = useAuth();
  const router = useRouter();

  const collectionCases = useMemo(() => {
    if(!transactions || !users) return [];
    return transactions
      .filter(tx => {
        const debtor = users.find(u => u.id === tx.clientId);
        return tx.status === 'En Cobranza' &&
               (!selectedCountry || debtor?.country === selectedCountry);
      })
      .map(tx => {
        const debtor = users.find(u => u.id === tx.clientId);
        return {
          transaction: tx,
          debtor,
        };
      })
      .filter(caseItem => !!caseItem.debtor); // Ensure we found the debtor
  }, [transactions, users, selectedCountry]);

  const handleContact = (debtorId: string) => {
      if (!currentUser) return;
      const conversationId = [currentUser.id, debtorId].sort().join('-');
      sendMessage({
          senderId: currentUser.id,
          recipientId: debtorId,
          conversationId,
          text: "Hola, te contactamos del equipo de Corabo para conversar sobre un pago pendiente. Por favor, responde a este mensaje."
      });
      router.push(`/messages/${conversationId}`);
  };

  const handleResolve = (txId: string) => {
    // Logic to mark as resolved will be added here
    console.log(`Resolving transaction ${txId}`);
  };

  const handleWriteOff = (txId: string) => {
    // Logic to mark as uncollectible
    console.log(`Writing off transaction ${txId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Cobranzas</CardTitle>
        <CardDescription>
          Casos que han superado los plazos de pago y requieren intervención manual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {collectionCases.length > 0 ? (
          <div className="space-y-4">
            {collectionCases.map(({ transaction, debtor }) => (
              <div key={transaction.id} className="border p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                    <Avatar className="h-12 w-12 hidden sm:flex">
                        <AvatarImage src={debtor?.profileImage} />
                        <AvatarFallback>{debtor?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{debtor?.name}</p>
                        <p className="text-sm text-muted-foreground">{transaction.details.serviceName || transaction.details.system}</p>
                        <Badge variant="destructive" className="mt-1">
                            ${transaction.amount.toFixed(2)} - Vencido
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{debtor?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                         <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{debtor?.phone || debtor?.profileSetupData?.paymentDetails?.mobile?.mobilePaymentPhone || 'No disponible'}</span>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center pt-2 sm:pt-0 border-t sm:border-none w-full sm:w-auto">
                    <Button size="sm" onClick={() => handleContact(transaction.clientId)}>
                        <MessageSquare className="mr-2 h-4 w-4"/>Contactar
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => handleResolve(transaction.id)}>
                        <Handshake className="mr-2 h-4 w-4"/>Resolver
                    </Button>
                     <Button size="sm" variant="destructive" onClick={() => handleWriteOff(transaction.id)}>
                        <XCircle className="mr-2 h-4 w-4"/>Incobrable
                    </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Actualmente no hay casos en gestión de cobranza para el país seleccionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
