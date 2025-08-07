
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export function PaymentVerificationTab() {
  const { transactions, users, verifyCampaignPayment } = useCorabo();

  const pendingPayments = transactions.filter(
    tx => tx.type === 'Sistema' && tx.status === 'Pago Enviado - Esperando Confirmación'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación de Pagos de Campañas</CardTitle>
        <CardDescription>Aprueba los pagos para activar las campañas de los proveedores.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length > 0 ? (
                pendingPayments.map(tx => {
                  const user = users.find(u => u.id === tx.clientId);
                  const campaignId = tx.details.system?.match(/Pago de campaña publicitaria: (.*)/)?.[1];
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{user?.name || tx.clientId}</TableCell>
                      <TableCell>${tx.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.details.system}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => campaignId && verifyCampaignPayment(tx.id, campaignId)}
                          disabled={!campaignId}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verificar y Activar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No hay pagos pendientes de verificación.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
