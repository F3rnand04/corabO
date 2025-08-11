
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getProfileProducts } from '@/ai/flows/profile-flow';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import { Skeleton } from '@/components/ui/skeleton';


export default function CatalogPage() {
  const router = useRouter();
  const { currentUser } = useCorabo();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Correctly call the Genkit flow to get products.
      const productData = await getProfileProducts({ userId: currentUser.id, limitNum: 50 });
      setProducts(productData.products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar tu catálogo de productos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  
  const openProductDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };

  return (
    <>
        {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
        ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.map(product => (
                    <ProductGridCard 
                    key={product.id} 
                    product={product}
                    onDoubleClick={() => openProductDetailsDialog(product)}
                    />
                ))}
            </div>
        ) : (
            <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4 rounded-lg">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg text-foreground">Tu catálogo está vacío</h3>
                <p className="text-muted-foreground text-sm">Haz clic en el botón (+) en el pie de página para añadir tu primer producto.</p>
            </div>
        )}
     {selectedProduct && (
        <ProductDetailsDialog
            isOpen={isProductDetailsDialogOpen}
            onOpenChange={setIsProductDetailsDialogOpen}
            product={selectedProduct}
        />
      )}
    </>
  );
}
