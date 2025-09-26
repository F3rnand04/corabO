
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import type { Transaction, User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth-provider";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, Truck, Banknote, ClipboardCheck, CalendarCheck, Star, XCircle, FileText, Repeat } from "lucide-react";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { sendQuote, confirmPaymentReceived, completeWork, acceptAppointment, startDispute, cancelSystemTransaction, confirmWorkReceived } from '@/lib/actions/transaction.actions';
import { downloadTransactionsPDF } from '@/lib/pdf-utils';
import { retryFindDelivery, assignOwnDelivery, resolveDeliveryAsPickup } from '@/lib/actions/delivery.actions';


// --- Sub-components for Actions ---

function ProviderActions({ tx, onAction }: { tx: Transaction; onAction: () => void }) {
  const { currentUser } = useAuth();
  
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);

  if (!currentUser) return null;

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote({ transactionId: tx.id, userId: currentUser.id, breakdown: quoteBreakdown, total: quoteTotal });
      onAction();
    }
  };

  const handleConfirmPayment = (fromThirdParty: boolean) => {
    if (!currentUser) return;
    confirmPaymentReceived({ transactionId: tx.id, userId: currentUser.id, fromThirdParty });
    onAction();
  };

  const handleCompleteWork = () => {
    if (!currentUser) return;
    completeWork({ transactionId: tx.id, userId: currentUser.id });
    onAction();
  };

  const handleAcceptAppointment = () => {
    if (!currentUser) return;
    acceptAppointment({transactionId: tx.id, userId: currentUser.id});
    onAction();
  }

  const actionMap: Record<string, ReactNode> = {
    'Solicitud Pendiente': (
      <div className="w-full space-y-2 pt-4 border-t">
        <h4 className="font-semibold">Enviar Cotización</h4>
        <Textarea placeholder="Desglose de costos y condiciones..." value={quoteBreakdown} onChange={e => setQuoteBreakdown(e.target.value)} />
        <Input type="number" placeholder="Monto total" value={quoteTotal || ''} onChange={e => setQuoteTotal(parseFloat(e.target.value))} />
        <Button onClick={handleSendQuote} className="w-full">Enviar Cotización</Button>
      </div>
    ),
    'Pago Enviado - Esperando Confirmación': (
      <AlertDialog>
        <AlertDialogTrigger asChild><Button className="w-full">Confirmar Pago</Button></AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Recepción de Pago</AlertDialogTitle>
                <AlertDialogDescription>
                    Por favor, confirma que has recibido el pago. Si el pago proviene de una cuenta que no pertenece al titular de la cuenta Corabo, por favor repórtalo para mantener la seguridad de la comunidad.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:flex-row-reverse">
                <AlertDialogAction onClick={() => handleConfirmPayment(false)}>Confirmar Pago del Titular</AlertDialogAction>
                <Button variant="destructive" type="button" onClick={() => handleConfirmPayment(true)}>Reportar Pago de Tercero</Button>
                <AlertDialogCancel className="mt-2 sm:mt-0">Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    'Acuerdo Aceptado - Pendiente de Ejecución': (
      <Button onClick={handleCompleteWork} className="w-full"><ClipboardCheck className="mr-2 h-4 w-4" />Marcar como Finalizado</Button>
    ),
     'Cita Solicitada': (
      <Button onClick={handleAcceptAppointment} className="w-full"><CalendarCheck className="mr-2 h-4 w-4" />Aceptar y Crear Compromiso</Button>
    ),
  };

  return actionMap[tx.status] || null;
}

function ClientActions({ tx, onAction }: { tx: Transaction; onAction: () => void }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showRatingScreen, setShowRatingScreen] = useState(false);

  if (!currentUser) return null;

  const handleConfirmWorkReceived = async () => {
    if (rating === 0) return;
    if (!currentUser) return;
    await confirmWorkReceived({transactionId: tx.id, userId: currentUser.id, rating, comment});
    setShowRatingScreen(false);
    onAction();
    // Redirect to payment page after rating
    router.push(`/payment?commitmentId=${tx.id}`);
  }

  if (showRatingScreen) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-8 h-8 cursor-pointer ${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} onClick={() => setRating(star)} />
            ))}
        </div>
        <Textarea placeholder="Añade un comentario opcional..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowRatingScreen(false)}>Atrás</Button>
          <Button onClick={handleConfirmWorkReceived} disabled={rating === 0}>Continuar al Pago</Button>
        </div>
      </div>
    );
  }


  const actionMap: Record<string, ReactNode> = {
    'Pendiente de Confirmación del Cliente': (
      <Button onClick={() => setShowRatingScreen(true)} className="w-full">Confirmar Recepción y Calificar</Button>
    ),
    'Finalizado - Pendiente de Pago': (
      <Button onClick={() => router.push(`/payment?commitmentId=${tx.id}`)} className="w-full"><Banknote className="mr-2 h-4 w-4" />Pagar Ahora</Button>
    ),
    'Cotización Recibida': (
       <Button onClick={() => router.push(`/payment?commitmentId=${tx.id}`)} className="w-full"><Banknote className="mr-2 h-4 w-4" />Pagar Ahora</Button>
    ),
  };

  return actionMap[tx.status] || null;
}


// --- Main Dialog Component ---
interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}


export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, users } = useAuth();

  const [otherParty, setOtherParty] = useState<User | null>(null);
  const [isDeliveryFailedDialogOpen, setIsDeliveryFailedDialogOpen] = useState(false);

  useEffect(() => {
    if (transaction && currentUser) {
        const otherId = transaction.providerId === currentUser.id ? transaction.clientId : transaction.providerId;
        if (otherId) {
            const foundUser = users.find(u => u.id === otherId);
            setOtherParty(foundUser || null);
        }
        if (transaction.status === 'Error de Delivery - Acción Requerida') {
            setIsDeliveryFailedDialogOpen(true);
        }
    } else {
        setIsDeliveryFailedDialogOpen(false);
    }
  }, [transaction, currentUser, users]);

  if (!transaction || !currentUser) return null;
  
  const handleClose = () => onOpenChange(false);
  
  const isProvider = currentUser.type === 'provider';
  const isClient = currentUser.type === 'client';
  const isSystemTx = transaction.type === 'Sistema';
  const isRenewableTx = isSystemTx && transaction.details.isRenewable;

  const statusInfo: Record<string, { icon: React.ElementType, color: string }> = {
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
    'Pendiente de Confirmación del Cliente': { icon: ClipboardCheck, color: 'bg-yellow-600' },
    'Pago Enviado - Esperando Confirmación': { icon: Banknote, color: 'bg-blue-500' },
    'Buscando Repartidor': { icon: Truck, color: 'bg-yellow-500' },
    'En Reparto': { icon: Truck, color: 'bg-blue-500' },
    'Resuelto': { icon: CheckCircle, color: 'bg-green-500' },
    'Error de Delivery - Acción Requerida': { icon: AlertTriangle, color: 'bg-red-500' },
  };

  const CurrentIcon = statusInfo[transaction.status]?.icon || AlertTriangle;
  const iconColor = statusInfo[transaction.status]?.color || 'bg-gray-500';
  

  const renderActionButtons = () => {
    if (isProvider) {
      return <ProviderActions tx={transaction} onAction={handleClose} />;
    }
    if (isClient) {
      return <ClientActions tx={transaction} onAction={handleClose} />;
    }
    return null;
  };

  return (
    <>
      <AlertDialog open={isDeliveryFailedDialogOpen} onOpenChange={setIsDeliveryFailedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>No se encontró un repartidor</AlertDialogTitle><AlertDialogDescription>Elige una opción para continuar.</AlertDialogDescription></AlertDialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button onClick={() => { if(transaction) { retryFindDelivery({transactionId: transaction.id}); handleClose(); } }}><Repeat className="mr-2 h-4 w-4"/>Volver a Intentar Búsqueda</Button>
            <Button onClick={() => { if(transaction && currentUser) { assignOwnDelivery(transaction.id, currentUser.id); handleClose(); } }} variant="outline"><Truck className="mr-2 h-4 w-4"/>Asignarme el Delivery</Button>
            <Button onClick={() => { if(transaction) { resolveDeliveryAsPickup({ transactionId: transaction.id }); handleClose(); } }} variant="secondary"><Handshake className="mr-2 h-4 w-4"/>Convertir a Retiro en Tienda</Button>
          </div>
          <AlertDialogFooter><AlertDialogCancel>Cerrar</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isOpen && !isDeliveryFailedDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}><CurrentIcon className="w-5 h-5 text-white" /></div>
              Detalles de la Transacción
            </DialogTitle>
            <DialogDescription>ID: {transaction.id}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-semibold">Estado:</span> <Badge variant="secondary">{transaction.status}</Badge></div>
              <div><span className="font-semibold">Fecha:</span> {new Date(transaction.date).toLocaleDateString()}</div>
              <div><span className="font-semibold">Tipo:</span> {transaction.type}</div>
              {transaction.details.baseAmount ? (
                <div className="col-span-2 space-y-1 mt-2 p-2 border-t">
                  <div className="flex justify-between"><span>Subtotal:</span> <span className="font-mono">Bs. {transaction.details.baseAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Comisión ({(transaction.details.commissionRate || 0) * 100}%):</span> <span className="font-mono">Bs. {transaction.details.commission?.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between"><span>IVA ({(transaction.details.taxRate || 0) * 100}%):</span> <span className="font-mono">Bs. {transaction.details.tax?.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between font-bold"><span>Total Factura:</span> <span className="font-mono">Bs. {(transaction.amount).toFixed(2)}</span></div>
                  <div className="text-xs text-muted-foreground text-right">Tasa de cambio: Bs. {transaction.details.exchangeRate?.toFixed(2)} / USD</div>
                </div>
              ) : (<div><span className="font-semibold">Monto:</span> ${transaction.amount.toFixed(2)}</div>)}
              <div><span className="font-semibold">Cliente:</span> {isClient ? "Tú" : otherParty?.name}</div>
              <div><span className="font-semibold">Proveedor:</span> {isProvider ? "Tú" : otherParty?.name || 'Sistema'}</div>
              {transaction.details.paymentFromThirdParty && <div className="col-span-2"><Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Pago recibido de un tercero</Badge></div>}
            </div>
            <hr/>
            {renderActionButtons()}
          </div>

          <DialogFooter className="flex-wrap sm:justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              {!isSystemTx && <Button variant="outline" onClick={() => startDispute(transaction.id)} disabled={transaction.status === 'En Disputa'}><ShieldAlert className="mr-2 h-4 w-4" /> Disputa</Button>}
              {isRenewableTx && <Button variant="destructive" onClick={() => cancelSystemTransaction(transaction.id)}><XCircle className="mr-2 h-4 w-4" /> Cancelar Renovación</Button>}
              {transaction.status === 'Pagado' && <Button variant="outline" onClick={() => downloadTransactionsPDF([transaction])}><FileText className="mr-2 h-4 w-4" /> PDF</Button>}
            </div>
            <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
