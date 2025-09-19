
'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, ImageDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { downloadTransactionsPDF } from '@/lib/actions/transaction.actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-provider';

// Constants
const IVA_RATE = 0.16;

interface AccountingTabProps {
  selectedCountry: string | null;
}

export function AccountingTab({ selectedCountry }: AccountingTabProps) {
  const { transactions, users } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const accountingTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        const user = users.find(u => u.id === tx.clientId);
        return tx.type === 'Sistema' &&
               tx.providerId === 'corabo-admin' &&
               tx.status === 'Pagado' &&
               (!selectedCountry || user?.country === selectedCountry);
      })
      .map(tx => {
        const user = users.find(u => u.id === tx.clientId);
        const subtotal = tx.amount / (1 + IVA_RATE);
        const iva = tx.amount - subtotal;
        
        return {
          ...tx,
          userName: user?.name || tx.clientId,
          subtotal,
          iva,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, users, selectedCountry]);

  const handleExportPDF = async () => {
    if (accountingTransactions.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }
    setIsDownloading(true);
    try {
      const base64String = await downloadTransactionsPDF(accountingTransactions);
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64String}`;
      link.download = `corabo-libro-contable-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al generar PDF' });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <CardTitle>Libro Contable de Ingresos</CardTitle>
                <CardDescription>
                    Registro detallado de todos los pagos verificados recibidos por el sistema.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isDownloading}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Generando...' : 'Exportar a PDF'}
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table id="accounting-table">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">IVA (16%)</TableHead>
                <TableHead className="text-right font-bold">Total Pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingTransactions.length > 0 ? (
                accountingTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.userName}</TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="max-w-[200px] truncate">
                            {tx.details.system}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${tx.subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${tx.iva.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">${tx.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No hay transacciones contables registradas para el país seleccionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
