
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileProducts } from '@/ai/flows/profile-flow';

export default function CatalogPage() {
  const router = useRouter();
  const { currentUser } = useCorabo();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const result = await getProfileProducts({ userId: currentUser.id });

        // --- Inicio de la depuración ---
        try {
          console.log("Debugging products from getProfileProducts:", JSON.stringify(result.products, null, 2));
        } catch (e: any) { // Added type annotation for catch error
          console.error("Error serializing products from getProfileProducts:", e.message); // Log only the error message for clarity
        }
        // --- Fin de la depuración ---

        // Update the state with the fetched products
        setProducts(result.products || []); // Ensure you set the state after potential logging
      } catch (error) {
        console.error("Error fetching profile products:", error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar el catálogo',
          description: 'No se pudieron obtener los productos. Inténtalo de nuevo.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentUser, toast]);
  
  const openProductDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center pt-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
