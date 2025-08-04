
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, MessageCircle } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";


interface ProfileProductCardProps {
    product: Product;
}

export function ProfileProductCard({ product }: ProfileProductCardProps) {
    const { addToCart, currentUser } = useCorabo();
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100));
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(prev => !prev);
    }

    return (
        <div className="flex gap-4 border-b pb-4">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden shrink-0">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint="product image"
                />
            </div>
            <div className="flex flex-col flex-grow">
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 flex-grow">{product.description}</p>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleLike}>
                                <Heart className={cn("w-4 h-4", isLiked && "text-red-500 fill-red-500")} />
                            </Button>
                            <span className="text-xs">{likeCount}</span>
                        </div>
                         <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageCircle className="w-4 h-4"/>
                            <span className="text-xs">12</span>
                        </div>
                    </div>
                     <Badge variant="outline" className="text-base">${product.price.toFixed(2)}</Badge>
                </div>
            </div>
             {currentUser.type === 'client' && (
                <Button 
                    size="icon" 
                    className="w-12 h-12 self-center shrink-0" 
                    onClick={() => addToCart(product, 1)}
                >
                    <Plus className="w-6 h-6" />
                </Button>
             )}
        </div>
    );
}

