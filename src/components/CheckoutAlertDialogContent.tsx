

"use client";

import { useState, useEffect } from "react";
import { useCorabo } from "@/hooks/use-corabo";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Star, Truck, MapPin, Building, User, Phone, LocateFixed, Minus, Plus, Trash2 } from "lucide-react";
import { credicoraLevels } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import Image from "next/image";
import { ScrollArea } from "./ui/scroll-area";
import { checkout } from '@/lib/actions/transaction.actions';
import { updateCart } from '@/lib/actions/cart.actions';

export function CheckoutAlertDialogContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
    const { currentUser, users, deliveryAddress, setDeliveryAddressToCurrent, tempRecipientInfo, setTempRecipientInfo, activeCartForCheckout, setActiveCartForCheckout } = useCorabo();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup' | 'other_address' | 'current_location'>(
        () => tempRecipientInfo ? 'other_address' : 'home'
    );
    const [useCredicora, setUseCredicora] = useState(false);
    const [recipientName, setRecipientName] = useState(tempRecipientInfo?.name || '');
    const [recipientPhone, setRecipientPhone] = useState(tempRecipientInfo?.phone || '');
    const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false);
    
    // Delivery cost is now an estimate and will be confirmed on the backend
    const deliveryCostEstimate = 1.50; // Placeholder estimate

    useEffect(() => {
        const fromMap = searchParams.get('fromMap');
        if (fromMap && activeCartForCheckout) {
            onOpenChange(true);
            if(tempRecipientInfo){
                setDeliveryMethod('other_address');
            }
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('fromMap');
            router.replace(currentUrl.toString(), { scroll: false });
        }
    }, [searchParams, onOpenChange, tempRecipientInfo, router, activeCartForCheckout]);

    if (!currentUser || !activeCartForCheckout) {
        return (
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Error</AlertDialogTitle>
                    <AlertDialogDescription>No se pudo encontrar el carrito. Por favor, intenta de nuevo.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { onOpenChange(false); setActiveCartForCheckout(null); }}>Cerrar</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        );
    }
    
    const providerId = activeCartForCheckout[0]?.product.providerId;
    if (!providerId) return null;

    const provider = users.find(u => u.id === providerId);
    if (!provider) return null;
    
    const handleCheckout = () => {
        if(!currentUser.id) return;
        checkout(
            currentUser.id, 
            providerId, 
            deliveryMethod, 
            useCredicora, 
            tempRecipientInfo || undefined, 
            deliveryAddress
        );
        onOpenChange(false);
        setUseCredicora(false);
        setTempRecipientInfo(null);
        setActiveCartForCheckout(null);
    };
    
    const handleContinueToMap = () => {
        if (recipientName && recipientPhone) {
            setTempRecipientInfo({ name: recipientName, phone: recipientPhone });
            setIsRecipientDialogOpen(false);
            onOpenChange(false);
            router.push('/map?fromMap=true');
        }
    }
    
    const handleRemoveProviderCart = () => {
        if(!currentUser.id) return;
        activeCartForCheckout.forEach(item => {
            updateCart(currentUser.id, item.product.id, 0);
        });
        onOpenChange(false);
        setActiveCartForCheckout(null);
    };

    const providerAcceptsCredicora = provider.profileSetupData?.acceptsCredicora || false;
    const providerHasLocation = provider.profileSetupData?.hasPhysicalLocation || false;

    const subtotal = activeCartForCheckout.reduce((total, item) => total + item.product.price * item.quantity, 0);
    
    const userCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
    const creditLimit = currentUser.credicoraLimit || 0;
    
    const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
    const potentialFinancing = subtotal * financingPercentage;
    const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
    const productInitialPayment = subtotal - financedAmount;
    const totalToPayToday = productInitialPayment + (deliveryMethod === 'pickup' ? 0 : deliveryCostEstimate);
    const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;
    
    const isCheckoutDisabled = deliveryMethod !== 'pickup' && !deliveryAddress;

    return (
      <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Compra ({provider.name})</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4 -mx-6 px-2">
              <ScrollArea className="max-h-48 px-4">
                  <div className="space-y-3">
                    {activeCartForCheckout.map(item => (
                        <div key={item.product.id} className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                <Image src={item.product.imageUrl} alt={item.product.name} fill style={{objectFit: 'cover'}}/>
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm font-semibold line-clamp-1">{item.product.name}</p>
                                <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                            </div>
                             <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCart(currentUser.id, item.product.id, item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCart(currentUser.id, item.product.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                            </div>
                        </div>
                    ))}
                  </div>
              </ScrollArea>
               <div className="px-4">
                 <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={handleRemoveProviderCart}>
                    <Trash2 className="w-3 h-3 mr-1"/> Eliminar todos los productos de este proveedor
                 </Button>
               </div>
            </div>
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
                                <p className="text-xs text-muted-foreground font-mono truncate">{currentUser.profileSetupData?.location || "Sin dirección guardada"}</p>
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
                                {deliveryMethod === 'other_address' && tempRecipientInfo && deliveryAddress && (
                                    <div className="text-xs text-muted-foreground mt-1 border-l-2 pl-2 border-primary">
                                        <p>Para: <strong>{tempRecipientInfo.name}</strong> ({tempRecipientInfo.phone})</p>
                                        <p>En: <span className="font-mono">{deliveryAddress}</span></p>
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
                    <span className="font-semibold">{deliveryMethod === 'pickup' ? '$0.00' : `$${deliveryCostEstimate.toFixed(2)}`}</span>
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
                    <span>${useCredicora ? totalToPayToday.toFixed(2) : (subtotal + (deliveryMethod === 'pickup' ? 0 : deliveryCostEstimate)).toFixed(2)}</span>
                </div>
                {useCredicora && financedAmount > 0 && (
                    <p className="text-xs text-muted-foreground -mt-2 text-right">
                        y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                    </p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { onOpenChange(false); setActiveCartForCheckout(null); }}>Cancelar</AlertDialogCancel>
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
