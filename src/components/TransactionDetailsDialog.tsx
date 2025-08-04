

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, Truck, Banknote, ClipboardCheck, CalendarCheck, Contact } from "lucide-react";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, users, sendQuote, acceptQuote, startDispute, completeWork, acceptAppointment, sendMessage } = useCorabo();
  const router = useRouter();
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);

  if (!transaction) return null;

  const isProvider = currentUser.type === 'provider';
  const isClient = currentUser.type === 'client';
  const otherPartyId = transaction.providerId === currentUser.id ? transaction.clientId : transaction.providerId;
  const otherParty = users.find(u => u.id === otherPartyId);

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote(transaction.id, { breakdown: quoteBreakdown, total: quoteTotal });
      onOpenChange(false);
    }
  };

  const handlePayCommitment = () => {
    onOpenChange(false);
    router.push(`/quotes/payment?commitmentId=${transaction.id}&amount=${transaction.amount}`);
  }

  const handleCompleteWork = () => {
      completeWork(transaction.id);
      onOpenChange(false);
  }

  const handleAcceptAppointment = () => {
    acceptAppointment(transaction.id);
    onOpenChange(false);
  }

  const handleContactToReschedule = () => {
     if(otherPartyId) {
       const conversationId = sendMessage(otherPartyId, `Hola, he visto tu solicitud de cita para el ${new Date(transaction.date).toLocaleDateString()}. Quisiera discutir otro horario.`, false);
       router.push(`/messages/${conversationId}`);
       onOpenChange(false);
     }
  }

  const statusInfo = {
    'Solicitud Pendiente': { icon: MessageSquare, color: 'bg-yellow-500' },
    'Cotización Recibida': { icon: Send, color: 'bg-blue-500' },
    'Cita Solicitada': { icon: CalendarCheck, color: 'bg-orange-500' },
    'Servicio en Curso': { icon: Handshake, color: 'bg-green-500' },
    'En Disputa': { icon: ShieldAlert, color: 'bg-red-500' },
    'Pagado': { icon: CheckCircle, color: 'bg-green-500' },
    'Carrito Activo': { icon: AlertTriangle, color: 'bg-gray-500' },
    'Pre-factura Pendiente': { icon: AlertTriangle, color: 'bg-gray-500' },
    'Acuerdo Aceptado - Pendiente de Ejecución': { icon: Handshake, color: 'bg-cyan-500' },
    'Finalizado - Pendiente de Pago': { icon: ClipboardCheck, color: 'bg-orange-500' },
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
             <div><span className="font-semibold">Cliente:</span> {isClient ? "Tú" : (users.find(u => u.id === transaction.clientId)?.name)}</div>
             <div><span className="font-semibold">Proveedor:</span> {isProvider ? "Tú" : (users.find(u => u.id === transaction.providerId)?.name)}</div>
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
                    <span>Incluye delivery (${transaction.details.deliveryCost?.toFixed(2) || '0.00'})</span>
                </div>
              )}
            </div>
          )}
           {transaction.type === 'Servicio' && (
            <div>
                <h4 className="font-semibold mb-2">Detalles:</h4>
                 <div className="p-3 bg-muted rounded-md text-muted-foreground">
                   {transaction.details.serviceName}
                 </div>
                {transaction.details.quote && (
                    <div className="p-3 bg-muted rounded-md mt-2">
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
            <div className="flex gap-2">
                {isProvider && transaction.status === 'Solicitud Pendiente' && <Button onClick={handleSendQuote}>Enviar Cotización</Button>}
                
                {isProvider && transaction.status === 'Cita Solicitada' && (
                  <>
                    <Button onClick={handleAcceptAppointment}>
                      <CalendarCheck className="mr-2 h-4 w-4" /> Aceptar Cita y Crear Compromiso
                    </Button>
                     <Button variant="secondary" onClick={handleContactToReschedule}>
                       <Contact className="mr-2 h-4 w-4" /> Contactar para Reagendar
                    </Button>
                  </>
                )}
                
                {isProvider && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && <Button onClick={handleCompleteWork}><ClipboardCheck className="mr-2 h-4 w-4" />Marcar como Entregado/Finalizado</Button>}
                
                {isClient && transaction.status === 'Cotización Recibida' && <Button onClick={() => acceptQuote(transaction.id)}>Aceptar y Pagar</Button>}
                
                {(isClient && (transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' || transaction.status === 'Finalizado - Pendiente de Pago')) && (
                    <Button onClick={handlePayCommitment}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Pagar Ahora
                    </Button>
                )}
                 <Button variant="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
