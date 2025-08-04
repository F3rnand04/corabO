
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Product } from "@/lib/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProductGridCardProps {
    product: Product;
    onDoubleClick?: () => void;
}

export function ProductGridCard({ product, onDoubleClick }: ProductGridCardProps) {
    const { addToCart } = useCorabo();
    const [likeCount, setLikeCount] = useState<number | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        // Generate random number only on the client side to avoid hydration mismatch
        setLikeCount(Math.floor(Math.random() * 100));
    }, []);

    const handleLike = () => {
        setLikeCount(prev => (prev !== null ? (isLiked ? prev - 1 : prev + 1) : 0));
        setIsLiked(prev => !prev);
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
                    <Button 
                        size="sm"
                        className="h-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-none shadow-md"
                        onClick={() => addToCart(product, 1)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Añadir
                    </Button>
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
