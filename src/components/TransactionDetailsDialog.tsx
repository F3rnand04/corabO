
'use client';

import { useState, useEffect } from 'react';
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
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, Truck, Banknote, ClipboardCheck, CalendarCheck, Contact, Star, Calendar as CalendarIcon, Upload, Smartphone, MapPin, XCircle, KeyRound, FileText, Repeat } from "lucide-react";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription as AlertDialogAlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


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

function ConfirmPaymentDialog({ onConfirm, onReportThirdParty, onCancel }: { onConfirm: () => void, onReportThirdParty: () => void, onCancel: () => void }) {
    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Recepción de Pago</AlertDialogTitle>
                <AlertDialogDescription>
                    Por favor, confirma que has recibido el pago. Si el pago proviene de una cuenta que no pertenece al titular de la cuenta Corabo, por favor repórtalo para mantener la seguridad de la comunidad.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:flex-row-reverse">
                <AlertDialogAction onClick={onConfirm}>Confirmar Pago del Titular</AlertDialogAction>
                <Button variant="destructive" type="button" onClick={onReportThirdParty}>Reportar Pago de Tercero</Button>
                <AlertDialogCancel onClick={onCancel} className="mt-2 sm:mt-0">Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}

function DeliveryFailedDialog({ onRetry, onSelfDelivery, onConvertToPickup }: { onRetry: () => void; onSelfDelivery: () => void; onConvertToPickup: () => void; }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>No se encontró un repartidor</AlertDialogTitle>
        <AlertDialogDescription>
          No pudimos encontrar un repartidor disponible cerca de ti en este momento. Por favor, elige una de las siguientes opciones para continuar con el pedido.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Button onClick={onRetry}><Repeat className="mr-2 h-4 w-4"/>Volver a Intentar Búsqueda</Button>
        <Button onClick={onSelfDelivery} variant="outline"><Truck className="mr-2 h-4 w-4"/>Asignarme el Delivery</Button>
        <Button onClick={onConvertToPickup} variant="secondary"><Handshake className="mr-2 h-4 w-4"/>Convertir a Retiro en Tienda</Button>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cerrar</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}


export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, fetchUser, sendQuote, acceptQuote, startDispute, completeWork, confirmWorkReceived, acceptAppointment, payCommitment, confirmPaymentReceived, sendMessage, cancelSystemTransaction, downloadTransactionsPDF, exchangeRate, retryFindDelivery, assignOwnDelivery, resolveDeliveryAsPickup } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [otherParty, setOtherParty] = useState<User | null>(null);
  const [deliveryProvider, setDeliveryProvider] = useState<User | null>(null);
  const [isDeliveryFailedDialogOpen, setIsDeliveryFailedDialogOpen] = useState(false);
  
  // State for payment form
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Pago Móvil' | 'Binance'>('Transferencia');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentVoucher, setPaymentVoucher] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);


  useEffect(() => {
    if (transaction && currentUser) {
        const otherId = transaction.providerId === currentUser.id ? transaction.clientId : transaction.providerId;
        if (otherId) {
            fetchUser(otherId).then(setOtherParty);
        }
        if(transaction.details.deliveryProviderId) {
            fetchUser(transaction.details.deliveryProviderId).then(setDeliveryProvider);
        }
        if (transaction.status === 'Error de Delivery - Acción Requerida') {
          setIsDeliveryFailedDialogOpen(true);
        }
    } else {
      setIsDeliveryFailedDialogOpen(false);
    }
  }, [transaction, currentUser, fetchUser]);

  if (!transaction || !currentUser) return null;

  const isProvider = currentUser?.type === 'provider';
  const isClient = currentUser?.type === 'client';
  const isSystemTx = transaction.type === 'Sistema';
  const isRenewableTx = isSystemTx && transaction.details.isRenewable;
  const isCrossBorder = currentUser.country !== otherParty?.country;

  const handleClose = () => {
    setShowRatingScreen(false);
    setShowPaymentScreen(false);
    setRating(0);
    setComment("");
    setPaymentMethod('Transferencia');
    setPaymentReference('');
    setPaymentVoucher(null);
    onOpenChange(false);
  }

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote(transaction.id, { breakdown: quoteBreakdown, total: quoteTotal });
      toast({ title: 'Cotización enviada', description: 'Se ha notificado al cliente.' });
      handleClose();
    }
  };
  
  const handleProcessPayment = async () => {
    if (paymentMethod !== 'Efectivo' && (!paymentReference || !paymentVoucher)) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Para este método de pago, la referencia y el comprobante son obligatorios.' });
      return;
    }
    setIsSubmittingPayment(true);
    let voucherUrl = '';
    if (paymentVoucher) {
      // In a real app, this would upload to Firebase Storage and get a URL
      voucherUrl = 'https://i.postimg.cc/L8y2zWc2/vzla-id.png'; // Placeholder
    }
    
    await payCommitment(transaction.id, {
      paymentMethod,
      paymentReference,
      paymentVoucherUrl: voucherUrl,
    });
    
    toast({ title: 'Pago Registrado', description: 'Tu pago ha sido enviado al proveedor para su confirmación.' });
    setIsSubmittingPayment(false);
    handleClose();
  };

  const handleCompleteWork = () => {
      completeWork(transaction.id);
      toast({ title: 'Trabajo finalizado', description: 'Se ha notificado al cliente para que confirme.' });
      handleClose();
  }

  const handleConfirmWorkReceived = () => {
      if (rating === 0) {
        toast({ variant: 'destructive', title: 'Calificación requerida', description: 'Por favor, selecciona una calificación de estrellas.' });
        return;
      }
      confirmWorkReceived(transaction.id, rating, comment);
      setShowRatingScreen(false);
      setShowPaymentScreen(true);
  }

  const handleAcceptAppointment = () => {
    acceptAppointment(transaction.id);
    toast({ title: 'Cita aceptada', description: 'Se ha creado un compromiso de pago.' });
    handleClose();
  }

  const handleContactToReschedule = () => {
     if(otherParty?.id) {
       sendMessage({recipientId: otherParty.id, text: `Hola, vi tu solicitud de cita para el ${new Date(transaction.date).toLocaleDateString()}. Me gustaría discutir otra hora.`});
       router.push(`/messages/${otherParty.id}`);
       handleClose();
     }
  }

  const handleConfirmPayment = (fromThirdParty: boolean) => {
    confirmPaymentReceived(transaction.id, fromThirdParty);
    toast({ title: 'Pago confirmado', description: 'La transacción ha sido completada.' });
    handleClose();
  };

  const handleSendToDelivery = () => {
    const location = transaction?.details?.deliveryLocation;
    if (!location) return;

    const deliveryMessage = `Nuevo pedido para entregar a: ${location.address}. Detalles: ${transaction.details.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}. Ver en mapa: https://www.google.com/maps?q=${location.lat},${location.lon}`;
    
    if(currentUser.contacts && currentUser.contacts.length > 0){
      const deliveryContactId = currentUser.contacts[0].id;
      sendMessage({recipientId: deliveryContactId, text: deliveryMessage});
      router.push(`/messages/${deliveryContactId}`);
      handleClose();
    } else {
        toast({ variant: 'destructive', title: 'Sin Repartidores', description: 'No tienes repartidores en tus contactos para enviar el pedido.'});
    }
  };

  const handleCancelRenewal = async () => {
    await cancelSystemTransaction(transaction.id);
    handleClose();
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
    'Pendiente de Confirmación del Cliente': { icon: ClipboardCheck, color: 'bg-yellow-600' },
    'Pago Enviado - Esperando Confirmación': { icon: Banknote, color: 'bg-blue-500' },
    'Buscando Repartidor': { icon: Truck, color: 'bg-yellow-500' },
    'En Reparto': { icon: Truck, color: 'bg-blue-500' },
    'Resuelto': { icon: CheckCircle, color: 'bg-green-500' },
    'Error de Delivery - Acción Requerida': { icon: AlertTriangle, color: 'bg-red-500' },
  };

  const CurrentIcon = statusInfo[transaction.status]?.icon || AlertTriangle;
  const iconColor = statusInfo[transaction.status]?.color || 'bg-gray-500';

  const showPayButton = isClient && ['Finalizado - Pendiente de Pago', 'Cotización Recibida'].includes(transaction.status) && !isRenewableTx;

  const originalAmountUSD = transaction.details.amountUSD || (transaction.amount / (transaction.details.exchangeRate || exchangeRate));
  const adjustedAmountLocal = originalAmountUSD * exchangeRate;
  const rateHasChanged = transaction.details.exchangeRate && Math.abs(transaction.details.exchangeRate - exchangeRate) > 0.01;
  
  if (showPaymentScreen) {
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Realiza el pago al proveedor y luego registra los detalles aquí para confirmar.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {rateHasChanged && (
                      <Alert variant="warning">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Ajuste por Tasa de Cambio</AlertTitle>
                          <AlertDialogAlertDescription>
                              El monto a pagar se ha ajustado de ${transaction.amount.toFixed(2)} a ${adjustedAmountLocal.toFixed(2)} para reflejar la tasa de cambio actual.
                          </AlertDialogAlertDescription>
                      </Alert>
                    )}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Monto Total a Pagar</p>
                        <p className="text-4xl font-bold tracking-tighter">${adjustedAmountLocal.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <Select onValueChange={(v) => setPaymentMethod(v as any)} defaultValue={paymentMethod}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {otherParty?.profileSetupData?.paymentDetails?.account?.active && !isCrossBorder && <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>}
                                {otherParty?.profileSetupData?.paymentDetails?.mobile?.active && !isCrossBorder && <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>}
                                {otherParty?.profileSetupData?.paymentDetails?.crypto?.active && <SelectItem value="Binance">Binance Pay</SelectItem>}
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentMethod !== 'Efectivo' && (
                      <div className="space-y-2">
                        <Label htmlFor="ref">Número de Referencia</Label>
                        <Input id="ref" placeholder="Introduce el número de referencia aquí..." value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}/>
                      </div>
                    )}
                     <div className="space-y-2">
                         <Label htmlFor="voucher-upload">Comprobante (opcional para efectivo)</Label>
                         <div className="flex items-center gap-2">
                             <Label htmlFor="voucher-upload" className="cursor-pointer flex-shrink-0">
                                 <Button asChild variant="outline">
                                     <span><Upload className="h-4 w-4 mr-2"/>Subir archivo</span>
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
                                 {paymentVoucher ? paymentVoucher.name : 'Ningún archivo seleccionado...'}
                             </span>
                         </div>
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPaymentScreen(false)}>Atrás</Button>
                    <Button onClick={handleProcessPayment} disabled={isSubmittingPayment}>
                      {isSubmittingPayment && <span className="animate-spin mr-2">...</span>}
                      Confirmar y Enviar Pago
                    </Button>
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
                    <DialogTitle>Calificar Servicio</DialogTitle>
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
                    <Button variant="outline" onClick={() => setShowRatingScreen(false)}>Atrás</Button>
                    <Button onClick={handleConfirmWorkReceived} disabled={rating === 0}>Continuar al Pago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <>
      <AlertDialog open={isDeliveryFailedDialogOpen} onOpenChange={setIsDeliveryFailedDialogOpen}>
        <DeliveryFailedDialog 
          onRetry={() => { retryFindDelivery(transaction.id); handleClose(); }}
          onSelfDelivery={() => { assignOwnDelivery(transaction.id); handleClose(); }}
          onConvertToPickup={() => { resolveDeliveryAsPickup(transaction.id); handleClose(); }}
        />
      </AlertDialog>
      <Dialog open={isOpen && !isDeliveryFailedDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                  <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              Detalles de la Transacción
            </DialogTitle>
            <DialogDescription>ID: {transaction.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            {isCrossBorder && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>¡Aviso de Comercio Internacional!</AlertTitle>
                    <AlertDialogAlertDescription>
                        Esta es una transacción entre usuarios de diferentes países. Se recomienda usar métodos de pago internacionales como Binance Pay y acordar claramente los términos de envío e impuestos.
                    </AlertDialogAlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-semibold">Estado:</span> <Badge variant="secondary">{transaction.status}</Badge></div>
              <div><span className="font-semibold">Fecha:</span> {new Date(transaction.date).toLocaleDateString()}</div>
              <div><span className="font-semibold">Tipo:</span> {transaction.type}</div>
              {transaction.details.baseAmount ? (
                <div className="col-span-2 space-y-1 mt-2 p-2 border-t">
                  <div className="flex justify-between"><span>Subtotal:</span> <span className="font-mono">Bs. {transaction.details.baseAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Comisión ({(transaction.details.commissionRate || 0) * 100}%):</span> <span className="font-mono">Bs. {transaction.details.commission?.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between"><span>IVA ({(transaction.details.taxRate || 0) * 100}%):</span> <span className="font-mono">Bs. {transaction.details.tax?.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between font-bold"><span>Total Factura:</span> <span className="font-mono">Bs. {transaction.details.total?.toFixed(2) || '0.00'}</span></div>
                  <div className="text-xs text-muted-foreground text-right">Tasa de cambio: Bs. {transaction.details.exchangeRate?.toFixed(2)} / USD</div>
                </div>
              ) : (
                  <div><span className="font-semibold">Monto:</span> ${transaction.amount.toFixed(2)}</div>
              )}
              <div><span className="font-semibold">Cliente:</span> {isClient ? "Tú" : otherParty?.name}</div>
              <div><span className="font-semibold">Proveedor:</span> {isProvider ? "Tú" : otherParty?.name || 'Sistema'}</div>
              {transaction.details.paymentFromThirdParty && (
                  <div className="col-span-2">
                      <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Pago recibido de un tercero
                      </Badge>
                  </div>
              )}
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
                  <div className="p-3 bg-muted rounded-md mt-2">
                      <p className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Detalles de Envío</p>
                      <p className="text-muted-foreground text-xs mt-1">Costo: ${transaction.details.deliveryCost?.toFixed(2) || '0.00'}</p>
                      <p className="text-muted-foreground text-xs">Repartidor: {deliveryProvider?.name || 'Buscando...'}</p>
                      {transaction.details.deliveryLocation && (
                          <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-semibold flex items-center gap-1"><MapPin className="h-3 w-3"/> Ubicación de Entrega:</p>
                              <p className="text-xs">{transaction.details.deliveryLocation.address}</p>
                              <a href={`https://www.google.com/maps?q=${transaction.details.deliveryLocation.lat},${transaction.details.deliveryLocation.lon}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                Ver en mapa
                              </a>
                          </div>
                      )}
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
                          <p className="font-semibold">Detalles de la cotización:</p>
                          <p className="text-muted-foreground">{transaction.details.quote.breakdown}</p>
                      </div>
                  )}
              </div>
            )}
            {isSystemTx && (
              <div>
                  <h4 className="font-semibold mb-2">Detalles:</h4>
                  <div className="p-3 bg-muted rounded-md text-muted-foreground">
                    {transaction.details.system}
                  </div>
              </div>
            )}
            
            {transaction.type !== 'Compra Directa' && (
              <p className='text-xs text-muted-foreground text-right italic'>Los montos no incluyen IVA (16%).</p>
            )}


            {isProvider && transaction.status === 'Solicitud Pendiente' && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold">Enviar Cotización</h4>
                <Textarea placeholder="Desglose de costos y condiciones..." value={quoteBreakdown} onChange={e => setQuoteBreakdown(e.target.value)} />
                <Input type="number" placeholder="Monto total" value={quoteTotal} onChange={e => setQuoteTotal(parseFloat(e.target.value))} />
              </div>
            )}
          </div>
          <DialogFooter className="flex-wrap sm:justify-between gap-2">
              <div className="flex gap-2">
                  {!isSystemTx && (
                      <Button variant="outline" onClick={() => startDispute(transaction.id)} disabled={transaction.status === 'En Disputa'}>
                          <ShieldAlert className="mr-2 h-4 w-4" /> Iniciar Disputa
                      </Button>
                  )}
                  {isRenewableTx && (
                      <Button variant="destructive" onClick={handleCancelRenewal}>
                          <XCircle className="mr-2 h-4 w-4" /> Cancelar Renovación
                      </Button>
                  )}
                  {isProvider && transaction.type === "Compra" && transaction.details.deliveryLocation && transaction.status === 'Buscando Repartidor' && (
                      <Button variant="outline" onClick={handleSendToDelivery} disabled>
                          <Send className="mr-2 h-4 w-4"/> Notificar a Repartidor
                      </Button>
                  )}
                  {transaction.status === 'Pagado' && (
                    <Button variant="outline" onClick={() => {}}>
                        <FileText className="mr-2 h-4 w-4" /> Descargar PDF
                    </Button>
                  )}
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                  {isProvider && transaction.status === 'Solicitud Pendiente' && <Button onClick={handleSendQuote}>Enviar Cotización</Button>}
                  
                  {isProvider && transaction.status === 'Pago Enviado - Esperando Confirmación' && 
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button>Confirmar Pago</Button></AlertDialogTrigger>
                          <ConfirmPaymentDialog 
                              onConfirm={() => handleConfirmPayment(false)}
                              onReportThirdParty={() => handleConfirmPayment(true)}
                              onCancel={() => {}}
                          />
                      </AlertDialog>
                  }
                  
                  {isClient && transaction.status === 'Cita Solicitada' && (
                    <>
                      <Button onClick={handleAcceptAppointment}>
                        <CalendarCheck className="mr-2 h-4 w-4" /> Aceptar y Crear Compromiso
                      </Button>
                      <Button variant="secondary" onClick={handleContactToReschedule}>
                        <Contact className="mr-2 h-4 w-4" /> Contactar para Reagendar
                      </Button>
                    </>
                  )}

                  {isProvider && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && <Button onClick={handleCompleteWork}><ClipboardCheck className="mr-2 h-4 w-4" />Marcar como Finalizado</Button>}
                  
                  {isClient && transaction.status === 'Pendiente de Confirmación del Cliente' && <Button onClick={() => setShowRatingScreen(true)}>Confirmar Recepción y Calificar</Button>}
                  
                  {showPayButton && (
                    <Button onClick={() => setShowPaymentScreen(true)}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Pagar Ahora
                    </Button>
                  )}
                  
                  <DialogClose asChild>
                      <Button variant="secondary">Cerrar</Button>
                  </DialogClose>
              </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
