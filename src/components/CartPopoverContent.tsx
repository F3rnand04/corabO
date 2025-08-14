
"use client";

import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Minus, Plus, X } from "lucide-react";

export function CartPopoverContent({ onCheckoutClick }: { onCheckoutClick: () => void }) {
    const { cart, updateCartQuantity, getCartTotal } = useCorabo();

    return (
        <div className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Carrito de Compras</h4>
                <p className="text-sm text-muted-foreground">
                    Resumen de tu pedido global.
                </p>
            </div>
            {cart.length > 0 ? (
                <>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {cart.map(item => (
                            <div key={item.product.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                                <Link href={`/companies/${item.product.providerId}`} className="cursor-pointer hover:underline">
                                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                                    <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                                </Link>
                                <div className="flex items-center gap-1 border rounded-md">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => updateCartQuantity(item.product.id, 0)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-sm">
                        <span>Total:</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <Button className="w-full" onClick={onCheckoutClick}>Ver Pre-factura</Button>
                </>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
            )}
        </div>
    );
}
