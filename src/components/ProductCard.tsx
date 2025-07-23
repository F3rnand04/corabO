"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCorabo } from "@/contexts/CoraboContext";
import { Star, Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, users, currentUser } = useCorabo();
  const provider = users.find(u => u.id === product.providerId);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video">
        <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint="product technology"/>
      </div>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="pt-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Vendido por {provider?.name}</span>
             <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{provider?.reputation}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
        {currentUser.type === 'client' && (
          <Button onClick={() => addToCart(product, 1)}>
            <Plus className="mr-2 h-4 w-4" /> Añadir
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
