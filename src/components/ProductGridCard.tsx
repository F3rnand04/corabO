
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGridCardProps {
    product: Product;
}

export function ProductGridCard({ product }: ProductGridCardProps) {
    const { addToCart } = useCorabo();
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100));
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(prev => !prev);
    }

    return (
        <div className="relative aspect-square rounded-lg overflow-hidden group border shadow-sm">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="product image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                 <div className="absolute top-2 right-2">
                    <Button 
                        size="icon" 
                        variant="ghost"
                        className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white hover:text-white" 
                        onClick={() => addToCart(product, 1)}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
                <h4 className="font-bold text-sm leading-tight drop-shadow-md">{product.name}</h4>
                <div className="flex items-center justify-between mt-2">
                     <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Heart className={cn("w-4 h-4 cursor-pointer", isLiked && "text-red-500 fill-red-500")} onClick={handleLike} />
                            <span className="text-xs">{likeCount}</span>
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
