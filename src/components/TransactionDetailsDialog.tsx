

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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import type { Transaction } from "@/lib/types";
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, Truck, Banknote, ClipboardCheck, CalendarCheck, Contact, Star, Calendar as CalendarIcon, Upload } from "lucide-react";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function RatingInput({ rating, setRating }: { rating: number, setRating: (r: number) => void }) {
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    );
}


export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, users, sendQuote, acceptQuote, startDispute, completeWork, confirmWorkReceived, acceptAppointment, payCommitment, sendMessage } = useCorabo();
  const router = useRouter();
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [hasConfirmedReception, setHasConfirmedReception] = useState(false);
  
  // State for payment form
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentVoucher, setPaymentVoucher] = useState<File | null>(null);

  if (!transaction) return null;

  const isProvider = currentUser.type === 'provider';
  const isClient = currentUser.type === 'client';
  const otherPartyId = transaction.providerId === currentUser.id ? transaction.clientId : transaction.providerId;
  const otherParty = users.find(u => u.id === otherPartyId);

  const handleClose = () => {
    setShowRatingScreen(false);
    setShowPaymentScreen(false);
    setHasConfirmedReception(false);
    setRating(0);
    setComment("");
    onOpenChange(false);
  }

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote(transaction.id, { breakdown: quoteBreakdown, total: quoteTotal });
      handleClose();
    }
  };

  const handlePayCommitment = () => {
    if (!paymentReference || !paymentVoucher) return;
    payCommitment(transaction.id, rating, comment);
    handleClose();
  }

  const handleCompleteWork = () => {
      completeWork(transaction.id);
      handleClose();
  }

  const handleConfirmWorkReceived = () => {
      if (rating === 0) return;
      confirmWorkReceived(transaction.id, rating, comment);
      setShowRatingScreen(false);
      setShowPaymentScreen(true);
  }

  const handleAcceptAppointment = () => {
    acceptAppointment(transaction.id);
    handleClose();
  }

  const handleContactToReschedule = () => {
     if(otherPartyId) {
       const conversationId = sendMessage(otherPartyId, `Hola, he visto tu solicitud de cita para el ${new Date(transaction.date).toLocaleDateString()}. Quisiera discutir otro horario.`, false);
       router.push(`/messages/${conversationId}`);
       handleClose();
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
    'Pendiente de Confirmación del Cliente': { icon: ClipboardCheck, color: 'bg-yellow-500' },
    'Pago Enviado - Esperando Confirmación': { icon: Banknote, color: 'bg-blue-500' },
    'Resuelto': { icon: CheckCircle, color: 'bg-green-500' },
  };

  const CurrentIcon = statusInfo[transaction.status]?.icon || AlertTriangle;
  const iconColor = statusInfo[transaction.status]?.color || 'bg-gray-500';

  if (showPaymentScreen) {
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Realiza el pago a los datos del proveedor y luego registra los detalles aquí para confirmar.
                    </DialogDescription>
                </DialogHeader>
                 <div className="text-sm bg-muted p-4 rounded-lg border space-y-2">
                    <p className="font-bold mb-2">Datos para Pago Móvil</p>
                    <div className="flex justify-between"><span>Banco:</span><span className="font-mono">{otherParty?.name || "Banco de Corabo"}</span></div>
                    <div className="flex justify-between"><span>Teléfono:</span><span className="font-mono">0412-1234567</span></div>
                    <div className="flex justify-between"><span>RIF:</span><span className="font-mono">J-12345678-9</span></div>
                 </div>
                 <div className="py-4 space-y-4">
                     <div className="space-y-2">
                         <Label htmlFor="payment-bank">Banco de Origen</Label>
                         <Input id="payment-bank" placeholder="Ej: Banco Mercantil" value={paymentBank} onChange={(e) => setPaymentBank(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                         <Label>Fecha del Pago</Label>
                         <Popover>
                             <PopoverTrigger asChild>
                                 <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}>
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {paymentDate ? format(paymentDate, "PPP") : <span>Elige una fecha</span>}
                                 </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0">
                                 <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
                             </PopoverContent>
                         </Popover>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="ref">Número de Referencia</Label>
                        <Input id="ref" placeholder="Escribe el número de referencia aquí..." value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}/>
                    </div>
                     <div className="space-y-2">
                         <Label htmlFor="voucher-upload">Comprobante (Capture)</Label>
                         <div className="flex items-center gap-2">
                             <Label htmlFor="voucher-upload" className="cursor-pointer flex-shrink-0">
                                 <Button asChild variant="outline">
                                     <span><Upload className="h-4 w-4 mr-2"/>Subir Capture</span>
                                 </Button>
                             </Label>
                             <Input 
                                 id="voucher-upload" 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={(e) => setPaymentVoucher(e.target.files ? e.target.files[0] : null)}
                                 />
                             <span className={cn("text-sm text-muted-foreground truncate", paymentVoucher && "text-foreground font-medium")}>
                                 {paymentVoucher ? paymentVoucher.name : 'Ningún archivo...'}
                             </span>
                         </div>
                     </div>
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPaymentScreen(false)}>Volver</Button>
                    <Button onClick={handlePayCommitment} disabled={!paymentReference || !paymentVoucher}>Confirmar y Enviar Pago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  if (showRatingScreen) {
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Califica el Servicio</DialogTitle>
                    <DialogDescription>
                        Tu opinión es importante para la comunidad.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-6 space-y-6">
                    <RatingInput rating={rating} setRating={setRating} />
                    <Textarea
                        placeholder="Añade un comentario opcional sobre tu experiencia..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                    />
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRatingScreen(false)}>Volver</Button>
                    <Button onClick={handleConfirmWorkReceived} disabled={rating === 0}>Continuar a Pagar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                
                {isProvider && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && <Button onClick={handleCompleteWork}><ClipboardCheck className="mr-2 h-4 w-4" />Marcar como Finalizado</Button>}
                
                {isClient && transaction.status === 'Cotización Recibida' && <Button onClick={() => acceptQuote(transaction.id)}>Aceptar y Pagar</Button>}
                
                {isClient && transaction.status === 'Pendiente de Confirmación del Cliente' && <Button onClick={() => setShowRatingScreen(true)}>Confirmar Recepción y Calificar</Button>}

                {isClient && transaction.status === 'Finalizado - Pendiente de Pago' && <Button onClick={() => setShowPaymentScreen(true)}>Realizar Pago</Button>}
                
                {isClient && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                          <Banknote className="mr-2 h-4 w-4" />
                          Pagar Ahora
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmas que recibiste el servicio?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Estás a punto de pagar, pero primero necesitamos confirmar que el trabajo fue completado a tu satisfacción.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                       <AlertDialogFooter>
                           <AlertDialogCancel>No, aún no</AlertDialogCancel>
                           <AlertDialogAction onClick={() => { setHasConfirmedReception(true); setShowRatingScreen(true); }}>Sí, confirmar y continuar</AlertDialogAction>
                       </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                 <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
