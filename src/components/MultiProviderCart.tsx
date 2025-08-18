

"use client";

import { useMemo } from "react";
import { useCorabo } from "@/contexts/CoraboContext";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiProviderCartProps {
    onCheckoutClick: () => void;
}

export function MultiProviderCart({ onCheckoutClick }: MultiProviderCartProps) {
    const { cart, users, getCartTotal, setActiveCartForCheckout, updateCartQuantity } = useCorabo();

    const groupedCart = useMemo(() => {
        return cart.reduce((acc, item) => {
            const providerId = item.product.providerId;
            if (!acc[providerId]) {
                acc[providerId] = {
                    provider: users.find(u => u.id === providerId),
                    items: [],
                    subtotal: 0,
                    itemCount: 0,
                };
            }
            acc[providerId].items.push(item);
            acc[providerId].subtotal += item.product.price * item.quantity;
            acc[providerId].itemCount += item.quantity;
            return acc;
        }, {} as Record<string, { provider?: any; items: any[]; subtotal: number; itemCount: number }>);
    }, [cart, users]);
    
    const grandTotal = getCartTotal(cart);

    const handleCheckoutForProvider = (providerCart: { items: any[] }) => {
        setActiveCartForCheckout(providerCart.items);
        onCheckoutClick();
    };

    const handleRemoveProviderFromCart = (items: any[]) => {
        items.forEach(item => {
            updateCartQuantity(item.product.id, 0);
        });
    };


    return (
        <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {Object.values(groupedCart).map(({ provider, items, subtotal, itemCount }) => (
                    <Card key={provider?.id} className="p-3 relative group/provider-cart">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/provider-cart:opacity-100"
                            onClick={() => handleRemoveProviderFromCart(items)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={provider?.profileImage} />
                                    <AvatarFallback>{provider?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm truncate max-w-[120px]">{provider?.name}</p>
                                    <Badge variant="secondary" className="text-xs">{itemCount} producto(s)</Badge>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">${subtotal.toFixed(2)}</p>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-xs"
                                    onClick={() => handleCheckoutForProvider({ items })}
                                >
                                    Ver Prefactura
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span>Total Global:</span>
                <span>${grandTotal.toFixed(2)}</span>
            </div>
        </div>
    );
}

