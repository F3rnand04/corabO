
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
import { useToast } from '@/hooks/use-toast';


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
                <AlertDialogTitle>Confirm Payment Receipt</AlertDialogTitle>
                <AlertDialogDescription>
                    Please confirm that you have received the payment. If the payment comes from an account that does not belong to the Corabo account holder, please report it to maintain community security.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:flex-row-reverse">
                <AlertDialogAction onClick={onConfirm}>Confirm Holder's Payment</AlertDialogAction>
                <Button variant="destructive" onClick={onReportThirdParty}>Report Third-Party Payment</Button>
                <AlertDialogCancel onClick={onCancel} className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}


export function TransactionDetailsDialog({ transaction, isOpen, onOpenChange }: TransactionDetailsDialogProps) {
  const { currentUser, users, sendQuote, acceptQuote, startDispute, completeWork, confirmWorkReceived, acceptAppointment, payCommitment, confirmPaymentReceived, sendMessage } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  const [quoteBreakdown, setQuoteBreakdown] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [hasConfirmedReception, setHasConfirmedReception] = useState(false);
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] = useState(false);
  
  // State for payment form
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentVoucher, setPaymentVoucher] = useState<File | null>(null);

  if (!transaction) return null;

  const isProvider = currentUser?.type === 'provider';
  const isClient = currentUser?.type === 'client';
  const otherPartyId = transaction.providerId === currentUser?.id ? transaction.clientId : transaction.providerId;
  const otherParty = users.find(u => u.id === otherPartyId);
  const deliveryProvider = users.find(u => u.id === transaction.details.deliveryProviderId);

  const handleClose = () => {
    setShowRatingScreen(false);
    setShowPaymentScreen(false);
    setHasConfirmedReception(false);
    setShowConfirmPaymentDialog(false);
    setRating(0);
    setComment("");
    onOpenChange(false);
  }

  const handleSendQuote = () => {
    if (quoteTotal > 0 && quoteBreakdown) {
      sendQuote(transaction.id, { breakdown: quoteBreakdown, total: quoteTotal });
      toast({ title: 'Quote sent', description: 'The client has been notified.' });
      handleClose();
    }
  };

  const handlePayCommitment = () => {
    if (!paymentReference || !paymentVoucher) return;
    payCommitment(transaction.id, rating, comment);
    toast({ title: 'Payment registered', description: 'The provider will verify the payment.' });
    handleClose();
  }

  const handleCompleteWork = () => {
      completeWork(transaction.id);
      toast({ title: 'Work finished', description: 'The client has been notified to confirm.' });
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
    toast({ title: 'Appointment accepted', description: 'A payment commitment has been created.' });
    handleClose();
  }

  const handleContactToReschedule = () => {
     if(otherPartyId) {
       const conversationId = sendMessage(otherPartyId, `Hello, I saw your appointment request for ${new Date(transaction.date).toLocaleDateString()}. I would like to discuss another time.`, false);
       router.push(`/messages/${conversationId}`);
       handleClose();
     }
  }

  const handleConfirmPayment = (fromThirdParty: boolean) => {
    confirmPaymentReceived(transaction.id, fromThirdParty);
    toast({ title: 'Payment confirmed', description: 'The transaction has been completed.' });
    handleClose();
  };

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
    'En Reparto': { icon: Truck, color: 'bg-blue-500' },
    'Resuelto': { icon: CheckCircle, color: 'bg-green-500' },
  };

  const CurrentIcon = statusInfo[transaction.status]?.icon || AlertTriangle;
  const iconColor = statusInfo[transaction.status]?.color || 'bg-gray-500';

  if (showPaymentScreen) {
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Register Payment</DialogTitle>
                    <DialogDescription>
                        Make the payment to the provider's details and then register the details here to confirm.
                    </DialogDescription>
                </DialogHeader>
                 <div className="text-sm bg-muted p-4 rounded-lg border space-y-2">
                    <p className="font-bold mb-2">Data for Mobile Payment</p>
                    <div className="flex justify-between"><span>Bank:</span><span className="font-mono">{otherParty?.name || "Corabo Bank"}</span></div>
                    <div className="flex justify-between"><span>Phone:</span><span className="font-mono">0412-1234567</span></div>
                    <div className="flex justify-between"><span>RIF:</span><span className="font-mono">J-12345678-9</span></div>
                 </div>
                 <div className="py-4 space-y-4">
                     <div className="space-y-2">
                         <Label htmlFor="payment-bank">Origin Bank</Label>
                         <Input id="payment-bank" placeholder="E.g., Banco Mercantil" value={paymentBank} onChange={(e) => setPaymentBank(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                         <Label>Payment Date</Label>
                         <Popover>
                             <PopoverTrigger asChild>
                                 <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}>
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {paymentDate ? format(paymentDate, "PPP") : <span>Choose a date</span>}
                                 </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0">
                                 <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
                             </PopoverContent>
                         </Popover>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="ref">Reference Number</Label>
                        <Input id="ref" placeholder="Enter reference number here..." value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}/>
                    </div>
                     <div className="space-y-2">
                         <Label htmlFor="voucher-upload">Proof (Screenshot)</Label>
                         <div className="flex items-center gap-2">
                             <Label htmlFor="voucher-upload" className="cursor-pointer flex-shrink-0">
                                 <Button asChild variant="outline">
                                     <span><Upload className="h-4 w-4 mr-2"/>Upload Screenshot</span>
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
                                 {paymentVoucher ? paymentVoucher.name : 'No file...'}
                             </span>
                         </div>
                     </div>
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPaymentScreen(false)}>Back</Button>
                    <Button onClick={handlePayCommitment} disabled={!paymentReference || !paymentVoucher}>Confirm and Send Payment</Button>
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
                    <DialogTitle>Rate the Service</DialogTitle>
                    <DialogDescription>
                        Your opinion is important for the community.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-6 space-y-6">
                    <RatingInput rating={rating} setRating={setRating} />
                    <Textarea
                        placeholder="Add an optional comment about your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                    />
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRatingScreen(false)}>Back</Button>
                    <Button onClick={handleConfirmWorkReceived} disabled={rating === 0}>Continue to Pay</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }
  
  if (showConfirmPaymentDialog) {
    return (
       <AlertDialog open={showConfirmPaymentDialog} onOpenChange={setShowConfirmPaymentDialog}>
            <ConfirmPaymentDialog 
                onConfirm={() => handleConfirmPayment(false)}
                onReportThirdParty={() => handleConfirmPayment(true)}
                onCancel={handleClose}
            />
       </AlertDialog>
    )
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                <CurrentIcon className="w-5 h-5 text-white" />
            </div>
            Transaction Details
          </DialogTitle>
          <DialogDescription>ID: {transaction.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-semibold">Status:</span> <Badge variant="secondary">{transaction.status}</Badge></div>
            <div><span className="font-semibold">Date:</span> {new Date(transaction.date).toLocaleDateString()}</div>
            <div><span className="font-semibold">Type:</span> {transaction.type}</div>
            <div><span className="font-semibold">Amount:</span> ${transaction.amount.toFixed(2)}</div>
             <div><span className="font-semibold">Client:</span> {isClient ? "You" : (users.find(u => u.id === transaction.clientId)?.name)}</div>
             <div><span className="font-semibold">Provider:</span> {isProvider ? "You" : (users.find(u => u.id === transaction.providerId)?.name)}</div>
             {transaction.details.paymentFromThirdParty && (
                <div className="col-span-2">
                    <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Payment received from third party
                    </Badge>
                </div>
            )}
          </div>
          <hr/>
          {transaction.type === 'Compra' && transaction.details.items && (
            <div>
              <h4 className="font-semibold mb-2">Products:</h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                {transaction.details.items.map(item => (
                  <li key={item.product.id}>{item.quantity} x {item.product.name} (${item.product.price.toFixed(2)})</li>
                ))}
              </ul>
              {transaction.details.delivery && (
                <div className="p-3 bg-muted rounded-md mt-2">
                    <p className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery Details</p>
                    <p className="text-muted-foreground text-xs mt-1">Cost: ${transaction.details.deliveryCost?.toFixed(2) || '0.00'}</p>
                    <p className="text-muted-foreground text-xs">Provider: {deliveryProvider?.name || 'Searching...'}</p>
                </div>
              )}
            </div>
          )}
           {transaction.type === 'Servicio' && (
            <div>
                <h4 className="font-semibold mb-2">Details:</h4>
                 <div className="p-3 bg-muted rounded-md text-muted-foreground">
                   {transaction.details.serviceName}
                 </div>
                {transaction.details.quote && (
                    <div className="p-3 bg-muted rounded-md mt-2">
                        <p className="font-semibold">Quote details:</p>
                        <p className="text-muted-foreground">{transaction.details.quote.breakdown}</p>
                    </div>
                )}
            </div>
          )}

          {isProvider && transaction.status === 'Solicitud Pendiente' && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Send Quote</h4>
              <Textarea placeholder="Cost breakdown and conditions..." value={quoteBreakdown} onChange={e => setQuoteBreakdown(e.target.value)} />
              <Input type="number" placeholder="Total amount" value={quoteTotal} onChange={e => setQuoteTotal(parseFloat(e.target.value))} />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => startDispute(transaction.id)} disabled={transaction.status === 'En Disputa'}>
              <ShieldAlert className="mr-2 h-4 w-4" /> Start Dispute
            </Button>
            <div className="flex gap-2">
                {isProvider && transaction.status === 'Solicitud Pendiente' && <Button onClick={handleSendQuote}>Send Quote</Button>}
                
                {isProvider && transaction.status === 'Pago Enviado - Esperando Confirmación' && 
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button>Confirm Payment</Button>
                        </AlertDialogTrigger>
                        <ConfirmPaymentDialog 
                            onConfirm={() => handleConfirmPayment(false)}
                            onReportThirdParty={() => handleConfirmPayment(true)}
                            onCancel={() => {}}
                        />
                    </AlertDialog>
                }

                {isProvider && transaction.status === 'Cita Solicitada' && (
                  <>
                    <Button onClick={handleAcceptAppointment}>
                      <CalendarCheck className="mr-2 h-4 w-4" /> Accept & Create Commitment
                    </Button>
                     <Button variant="secondary" onClick={handleContactToReschedule}>
                       <Contact className="mr-2 h-4 w-4" /> Contact to Reschedule
                    </Button>
                  </>
                )}
                
                {isProvider && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && <Button onClick={handleCompleteWork}><ClipboardCheck className="mr-2 h-4 w-4" />Mark as Finished</Button>}
                
                {isClient && transaction.status === 'Cotización Recibida' && <Button onClick={() => acceptQuote(transaction.id)}>Accept and Pay</Button>}
                
                {isClient && transaction.status === 'Pendiente de Confirmación del Cliente' && <Button onClick={() => setShowRatingScreen(true)}>Confirm Reception and Rate</Button>}

                {isClient && transaction.status === 'Finalizado - Pendiente de Pago' && <Button onClick={() => setShowPaymentScreen(true)}>Make Payment</Button>}
                
                {isClient && transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                          <Banknote className="mr-2 h-4 w-4" />
                          Pay Now
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Confirm you received the service?</AlertDialogTitle>
                          <AlertDialogDescription>
                              You are about to pay, but first we need to confirm that the work was completed to your satisfaction.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                       <AlertDialogFooter>
                           <AlertDialogCancel>No, not yet</AlertDialogCancel>
                           <AlertDialogAction onClick={() => { setHasConfirmedReception(true); setShowRatingScreen(true); }}>Yes, confirm and continue</AlertDialogAction>
                       </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                 <Button variant="secondary" onClick={handleClose}>Close</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
