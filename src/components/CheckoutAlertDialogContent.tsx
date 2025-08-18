
"use client";

import { useState, useEffect } from "react";
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Star, Truck, MapPin, Building, User, Phone, LocateFixed } from "lucide-react";
import { credicoraLevels } from "@/lib/types";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";

export function CheckoutAlertDialogContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
    const { currentUser, cart, getCartTotal, getDeliveryCost, checkout: performCheckout, transactions, users, deliveryAddress, setDeliveryAddress, setDeliveryAddressToCurrent, tempRecipientInfo, setTempRecipientInfo, needsCheckoutDialog, setNeedsCheckoutDialog } = useCorabo();
    const router = useRouter();
    
    const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup' | 'other_address' | 'current_location'>('home');
    const [useCredicora, setUseCredicora] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false);

    const cartTransaction = cart.length > 0 ? transactions.find(tx => tx.status === 'Carrito Activo') : undefined;

    useEffect(() => {
        if(needsCheckoutDialog) {
            onOpenChange(true);
            setNeedsCheckoutDialog(false);
        }
    }, [needsCheckoutDialog, onOpenChange, setNeedsCheckoutDialog]);

    const handleCheckout = () => {
        if (cartTransaction) {
            performCheckout(cartTransaction.id, deliveryMethod, useCredicora, tempRecipientInfo || undefined);
            onOpenChange(false);
            setUseCredicora(false);
            setTempRecipientInfo(null);
        }
    };
    
    const handleContinueToMap = () => {
        if (recipientName && recipientPhone) {
            setTempRecipientInfo({ name: recipientName, phone: recipientPhone });
            setIsRecipientDialogOpen(false);
            onOpenChange(false);
            router.push('/map?fromMap=true');
        }
    }

    if (!currentUser || !cartTransaction) {
        return (
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Error</AlertDialogTitle>
                    <AlertDialogDescription>No se pudo encontrar el carrito. Por favor, intenta de nuevo.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cerrar</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        );
    }
    
    const provider = users.find(u => u.id === cart[0]?.product.providerId);
    if (!provider) return null;

    const providerAcceptsCredicora = provider.profileSetupData?.acceptsCredicora || false;
    const providerHasLocation = provider.profileSetupData?.hasPhysicalLocation || false;

    const subtotal = getCartTotal();
    const deliveryCost = getDeliveryCost(deliveryMethod);
    
    const userCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
    const creditLimit = currentUser.credicoraLimit || 0;
    
    const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
    const potentialFinancing = subtotal * financingPercentage;
    const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
    const productInitialPayment = subtotal - financedAmount;
    const totalToPayToday = productInitialPayment + deliveryCost;
    const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;
    
    const isCheckoutDisabled = deliveryMethod !== 'pickup' && !deliveryAddress;

    return (
      <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                <AlertDialogDescription>
                    Selecciona el método de entrega y confirma tu pedido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-3">
                    <Label>Método de Entrega</Label>
                    <RadioGroup 
                        value={deliveryMethod} 
                        onValueChange={(value) => {
                            if (value === 'current_location') {
                                setDeliveryAddressToCurrent();
                            }
                            if (value === 'other_address') {
                                setIsRecipientDialogOpen(true);
                            }
                            setDeliveryMethod(value as any)
                        }} 
                        className="space-y-2"
                    >
                        <Label htmlFor="delivery-home" className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="home" id="delivery-home" />
                            <div className="flex-grow">
                                <p className="font-semibold">Mi dirección guardada</p>
                                <p className="text-xs text-muted-foreground truncate">{currentUser.profileSetupData?.location || "Sin dirección guardada"}</p>
                            </div>
                        </Label>
                         <Label htmlFor="delivery-current" className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="current_location" id="delivery-current" />
                            <p className="font-semibold flex-grow flex items-center gap-2"><LocateFixed className="w-4 h-4"/> Mi ubicación actual (GPS)</p>
                        </Label>
                         <Label htmlFor="delivery-other" className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="other_address" id="delivery-other" />
                            <div className="flex-grow">
                                <p className="font-semibold">Enviar a otra dirección</p>
                                {deliveryMethod === 'other_address' && tempRecipientInfo && (
                                    <div className="text-xs text-muted-foreground">
                                        <p>Para: {tempRecipientInfo.name} ({tempRecipientInfo.phone})</p>
                                        <p>En: {deliveryAddress}</p>
                                    </div>
                                )}
                            </div>
                        </Label>
                        {providerHasLocation && (
                             <Label htmlFor="delivery-pickup" className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="pickup" id="delivery-pickup" />
                                <p className="font-semibold flex-grow">Recoger en tienda</p>
                                <Building className="h-4 w-4 text-muted-foreground"/>
                            </Label>
                        )}
                    </RadioGroup>
                </div>
                 <Separator />
                <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Costo de envío (aprox):</span>
                    <span className="font-semibold">${deliveryCost.toFixed(2)}</span>
                </div>

                {providerAcceptsCredicora && (
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <Label htmlFor="credicora-switch" className="flex items-center gap-2 text-blue-600 font-semibold">
                            <Star className="w-4 h-4 fill-current"/>
                            Pagar con Credicora
                        </Label>
                        <Switch id="credicora-switch" checked={useCredicora} onCheckedChange={setUseCredicora} />
                    </div>
                )}
                
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                    <span>Total a Pagar Hoy:</span>
                    <span>${useCredicora ? totalToPayToday.toFixed(2) : (subtotal + deliveryCost).toFixed(2)}</span>
                </div>
                {useCredicora && financedAmount > 0 && (
                    <p className="text-xs text-muted-foreground -mt-2 text-right">
                        y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                    </p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCheckout} disabled={isCheckoutDisabled}>
                    Pagar Ahora
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>¿Quién recibe el pedido?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="recipient-name" className="flex items-center gap-2"><User className="w-4 h-4" /> Nombre completo</Label>
                    <Input id="recipient-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nombre y Apellido"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recipient-phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> Teléfono de contacto</Label>
                    <Input id="recipient-phone" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Ej: 04121234567" />
                </div>
            </div>
            <Button onClick={handleContinueToMap} disabled={!recipientName || !recipientPhone}>
                Continuar al Mapa
            </Button>
        </DialogContent>
      </Dialog>
    );
}
