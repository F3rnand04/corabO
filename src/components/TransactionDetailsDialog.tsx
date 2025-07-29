
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import type { Transaction } from "@/lib/types";
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, Truck } from "lucide-react";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, sendQuote, acceptQuote, startDispute } = useCorabo();
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);

  if (!transaction) return null;

  const isProvider = currentUser.type === 'provider';
  const isClient = currentUser.type === 'client';

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote(transaction.id, { breakdown: quoteBreakdown, total: quoteTotal });
      onOpenChange(false);
    }
  };

  const statusInfo = {
    'Solicitud Pendiente': { icon: MessageSquare, color: 'bg-yellow-500' },
    'Cotización Recibida': { icon: Send, color: 'bg-blue-500' },
    'Servicio en Curso': { icon: Handshake, color: 'bg-green-500' },
    'En Disputa': { icon: ShieldAlert, color: 'bg-red-500' },
    'Pagado': { icon: CheckCircle, color: 'bg-green-500' },
    'Carrito Activo': { icon: AlertTriangle, color: 'bg-gray-500' },
    'Pre-factura Pendiente': { icon: AlertTriangle, color: 'bg-gray-500' },
    'Acuerdo Aceptado - Pendiente de Ejecución': { icon: Handshake, color: 'bg-green-500' },
    'Resuelto': { icon: CheckCircle, color: 'bg-green-500' },
  };

  const CurrentIcon = statusInfo[transaction.status]?.icon || AlertTriangle;
  const iconColor = statusInfo[transaction.status]?.color || 'bg-gray-500';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                <CurrentIcon className="w-5 h-5 text-white" />
            </div>
            Detalle de la Transacción
          </DialogTitle>
          <DialogDescription>ID: {transaction.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-semibold">Estado:</span> <Badge variant="secondary">{transaction.status}</Badge></div>
            <div><span className="font-semibold">Fecha:</span> {new Date(transaction.date).toLocaleDateString()}</div>
            <div><span className="font-semibold">Tipo:</span> {transaction.type}</div>
            <div><span className="font-semibold">Monto:</span> ${transaction.amount.toFixed(2)}</div>
          </div>
          <hr/>
          {transaction.type === 'Compra' && transaction.details.items && (
            <div>
              <h4 className="font-semibold mb-2">Productos:</h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                {transaction.details.items.map(item => (
                  <li key={item.product.id}>{item.quantity} x {item.product.name} (${item.product.price.toFixed(2)})</li>
                ))}
              </ul>
              {transaction.details.delivery && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                    <Truck className="h-4 w-4" />
                    <span>Incluye delivery (${transaction.details.deliveryCost.toFixed(2)})</span>
                </div>
              )}
            </div>
          )}
           {transaction.type === 'Servicio' && (
            <div>
                <h4 className="font-semibold mb-2">Servicio: {transaction.details.serviceName}</h4>
                {transaction.details.quote && (
                    <div className="p-3 bg-muted rounded-md">
                        <p className="font-semibold">Detalles de cotización:</p>
                        <p className="text-muted-foreground">{transaction.details.quote.breakdown}</p>
                    </div>
                )}
            </div>
          )}

          {isProvider && transaction.status === 'Solicitud Pendiente' && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Enviar Cotización</h4>
              <Textarea placeholder="Desglose de costos y condiciones..." value={quoteBreakdown} onChange={e => setQuoteBreakdown(e.target.value)} />
              <Input type="number" placeholder="Monto total" value={quoteTotal} onChange={e => setQuoteTotal(parseFloat(e.target.value))} />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => startDispute(transaction.id)} disabled={transaction.status === 'En Disputa'}>
              <ShieldAlert className="mr-2 h-4 w-4" /> Iniciar Disputa
            </Button>
            <div>
                {isProvider && transaction.status === 'Solicitud Pendiente' && <Button onClick={handleSendQuote}>Enviar Cotización</Button>}
                {isClient && transaction.status === 'Cotización Recibida' && <Button onClick={() => acceptQuote(transaction.id)}>Aceptar y Pagar</Button>}
                 <Button variant="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
