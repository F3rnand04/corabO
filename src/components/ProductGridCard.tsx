
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle, Minus } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Product } from "@/lib/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProductGridCardProps {
    product: Product;
    onDoubleClick?: () => void;
}

export function ProductGridCard({ product, onDoubleClick }: ProductGridCardProps) {
    const { currentUser, addToCart, updateCartQuantity, cart } = useCorabo();
    const { toast } = useToast();
    const [likeCount, setLikeCount] = useState<number | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    const cartItem = cart.find(item => item.product.id === product.id);
    const quantityInCart = cartItem?.quantity || 0;
    const isTransactionReady = currentUser.isTransactionsActive;

    useEffect(() => {
        // Generate random number only on the client side to avoid hydration mismatch
        setLikeCount(Math.floor(Math.random() * 100));
    }, []);

    const handleLike = () => {
        setLikeCount(prev => (prev !== null ? (isLiked ? prev - 1 : prev + 1) : 0));
        setIsLiked(prev => !prev);
    }
    
    const handleAddToCart = () => {
        if (!isTransactionReady) {
            toast({
                variant: "destructive",
                title: "Acción Requerida",
                description: "Por favor, activa tu registro de transacciones para poder comprar.",
            });
            return;
        }
        addToCart(product, 1);
    }
    
    const handleUpdateQuantity = (newQuantity: number) => {
        if (!isTransactionReady) return;
        updateCartQuantity(product.id, newQuantity);
    }


    return (
        <div 
            className="relative aspect-square rounded-lg overflow-hidden group border shadow-sm"
            onDoubleClick={onDoubleClick}
        >
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                data-ai-hint="product image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                 <div className="absolute top-2 right-2">
                    {quantityInCart === 0 ? (
                        <Button 
                            size="sm"
                            className="h-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-none shadow-md"
                            onClick={handleAddToCart}
                            disabled={!isTransactionReady}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1 bg-background text-foreground rounded-full h-8 shadow-md">
                            <Button variant="ghost" size="icon" className="h-full w-8 rounded-full" onClick={() => handleUpdateQuantity(quantityInCart - 1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-bold w-4 text-center">{quantityInCart}</span>
                             <Button variant="ghost" size="icon" className="h-full w-8 rounded-full" onClick={() => handleUpdateQuantity(quantityInCart + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <h4 className="font-bold text-sm leading-tight drop-shadow-md">{product.name}</h4>
                <div className="flex items-center justify-between mt-2">
                     <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Heart className={cn("w-4 h-4 cursor-pointer", isLiked && "text-red-500 fill-red-500")} onClick={handleLike} />
                            <span className="text-xs">{likeCount ?? '...'}</span>
                        </div>
                         <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4"/>
                            <span className="text-xs">12</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
