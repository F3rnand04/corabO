
"use client";

import { useState } from "react";
import { useCorabo } from "@/contexts/CoraboContext";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Star, Truck } from "lucide-react";
import { credicoraLevels } from "@/lib/types";

export function CheckoutAlertDialogContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
    const { currentUser, cart, getCartTotal, getDeliveryCost, checkout: performCheckout, transactions, users, deliveryAddress, setDeliveryAddress, router } = useCorabo();
    
    const [includeDelivery, setIncludeDelivery] = useState(false);
    const [useCredicora, setUseCredicora] = useState(false);

    const cartTransaction = cart.length > 0 ? transactions.find(tx => tx.status === 'Carrito Activo') : undefined;

    const handleCheckout = () => {
        if (cartTransaction) {
            performCheckout(cartTransaction.id, includeDelivery, useCredicora);
            onOpenChange(false);
            setUseCredicora(false);
        }
    };

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
    if (!provider) return null; // Or a loading state

    const isOnlyDelivery = provider.profileSetupData?.isOnlyDelivery || false;
    const providerAcceptsCredicora = provider.profileSetupData?.acceptsCredicora || false;

    const subtotal = getCartTotal();
    const deliveryCost = getDeliveryCost();
    const totalWithDelivery = subtotal + ((includeDelivery || isOnlyDelivery) ? deliveryCost : 0);
    
    const userCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
    const creditLimit = currentUser.credicoraLimit || 0;
    
    const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
    const potentialFinancing = subtotal * financingPercentage;
    const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
    const productInitialPayment = subtotal - financedAmount;
    const totalToPayToday = productInitialPayment + ((includeDelivery || isOnlyDelivery) ? deliveryCost : 0);
    const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                <AlertDialogDescription>
                    Revisa tu pedido. Puedes incluir el costo de envío y pagar con Credicora si está disponible.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="flex justify-between text-sm">
                    <span>Dirección de Entrega:</span>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => router.push('/map')}>Cambiar</Button>
                </div>
                <p className="text-sm font-semibold p-2 bg-muted rounded-md truncate">{deliveryAddress || "No especificada"}</p>
                <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="delivery-switch" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Incluir Delivery
                    </Label>
                    <Switch
                        id="delivery-switch"
                        checked={includeDelivery || isOnlyDelivery}
                        onCheckedChange={setIncludeDelivery}
                        disabled={isOnlyDelivery}
                    />
                </div>
                {isOnlyDelivery && <p className="text-xs text-muted-foreground -mt-2">Este proveedor solo trabaja con delivery.</p>}
                <div className="flex justify-between text-sm">
                    <span>Costo de envío (aprox):</span>
                    <span className="font-semibold">${(includeDelivery || isOnlyDelivery) ? deliveryCost.toFixed(2) : '0.00'}</span>
                </div>

                {providerAcceptsCredicora && (
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <Label htmlFor="credicora-switch" className="flex items-center gap-2 text-blue-600 font-semibold">
                            <Star className="w-4 h-4 fill-current"/>
                            Pagar con Credicora
                        </Label>
                        <Switch
                            id="credicora-switch"
                            checked={useCredicora}
                            onCheckedChange={setUseCredicora}
                        />
                    </div>
                )}
                
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                    <span>Total a Pagar Hoy:</span>
                    <span>${useCredicora ? totalToPayToday.toFixed(2) : totalWithDelivery.toFixed(2)}</span>
                </div>
                {useCredicora && financedAmount > 0 && (
                    <p className="text-xs text-muted-foreground -mt-2 text-right">
                        y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                    </p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCheckout} disabled={!cartTransaction}>Pagar Ahora</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}
