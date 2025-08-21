

"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { MultiProviderCart } from "./MultiProviderCart";

export function CartPopoverContent({ onCheckoutClick }: { onCheckoutClick: () => void }) {
    const { cart } = useCorabo();

    return (
        <div className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Carrito de Compras</h4>
                <p className="text-sm text-muted-foreground">
                    Gestiona tus compras por proveedor.
                </p>
            </div>
            {cart.length > 0 ? (
                <MultiProviderCart onCheckoutClick={onCheckoutClick} />
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
            )}
        </div>
    );
}
