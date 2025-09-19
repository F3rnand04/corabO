
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyCampaignPayment, sendNewCampaignNotifications } from '@/lib/actions/admin.actions';

export function PaymentVerificationTab() {
  const { transactions, users } = useAuth();
  const { toast } = useToast();

  const pendingPayments = transactions.filter(
    tx => tx.type === 'Sistema' && tx.status === 'Pago Enviado - Esperando Confirmación'
  );

  const handleVerifyAndNotify = async (transactionId: string, campaignId: string) => {
      // First, verify the payment and activate the campaign
      await verifyCampaignPayment(transactionId, campaignId);
      
      // Then, send the notifications
      try {
        await sendNewCampaignNotifications({ campaignId });
        toast({ title: "Campaña Activada y Notificada", description: "La campaña está activa y los usuarios han sido notificados." });
      } catch (error) {
        console.error("Error sending campaign notifications:", error);
        toast({ variant: "destructive", title: "Error de Notificación", description: "La campaña se activó, pero falló el envío de notificaciones." });
      }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación de Pagos (Campañas y Suscripciones)</CardTitle>
        <CardDescription>Aprueba los pagos para activar los beneficios de los usuarios y notificar cuando sea necesario.</CardDescription>
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
                  const isSubscription = tx.details.isSubscription;

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{user?.name || tx.clientId}</TableCell>
                      <TableCell>${tx.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.details.system}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (campaignId) {
                                handleVerifyAndNotify(tx.id, campaignId);
                            } else if (isSubscription) {
                                // Just verify the payment for subscriptions, no notification needed from here
                                verifyCampaignPayment(tx.id, ''); // Pass empty campaignId
                                toast({ title: "Suscripción Activada", description: "El pago del usuario ha sido verificado."});
                            }
                          }}
                          disabled={!campaignId && !isSubscription}
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
