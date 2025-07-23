"use client";

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, ShieldAlert } from 'lucide-react';

type FilterStatus = 'all' | TransactionStatus;

export default function TransactionsPage() {
  const { transactions, currentUser } = useCorabo();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const userTransactions = transactions
    .filter(tx => tx.clientId === currentUser.id || tx.providerId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = filter === 'all'
    ? userTransactions
    : userTransactions.filter(tx => tx.status === filter);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  const statusInfo: Record<TransactionStatus, { color: string, icon: React.ElementType }> = {
    'Carrito Activo': { color: 'bg-gray-500', icon: AlertTriangle },
    'Pre-factura Pendiente': { color: 'bg-gray-500', icon: AlertTriangle },
    'Pagado': { color: 'bg-green-500', icon: CheckCircle },
    'Solicitud Pendiente': { color: 'bg-yellow-500', icon: MessageSquare },
    'Cotización Recibida': { color: 'bg-blue-500', icon: MessageSquare },
    'Acuerdo Aceptado - Pendiente de Ejecución': { color: 'bg-green-500', icon: Handshake },
    'Servicio en Curso': { color: 'bg-green-500', icon: Handshake },
    'En Disputa': { color: 'bg-red-500', icon: ShieldAlert },
    'Resuelto': { color: 'bg-green-500', icon: CheckCircle },
  };

  const filters: FilterStatus[] = ['all', 'Solicitud Pendiente', 'En Disputa', 'Pagado', 'Servicio en Curso'];

  return (
    <>
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Transacciones</CardTitle>
            <CardDescription>
              Aquí puedes ver un historial cronológico de todas tus interacciones económicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterStatus)} className="mb-4">
                <TabsList>
                    {filters.map(f => (
                        <TabsTrigger key={f} value={f}>{f === 'all' ? 'Todas' : f}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                      const { icon: Icon, color } = statusInfo[tx.status];
                      return (
                        <TableRow key={tx.id} onClick={() => handleRowClick(tx)} className="cursor-pointer">
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${color}`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{tx.type === 'Compra' ? `Compra de ${tx.details.items?.length || 0} items` : `Servicio: ${tx.details.serviceName}`}</div>
                            <div className="text-sm text-muted-foreground">ID: {tx.id}</div>
                          </TableCell>
                          <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                          <TableCell>${tx.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{tx.status}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay transacciones que coincidan con el filtro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <TransactionDetailsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
      />
    </>
  );
}
