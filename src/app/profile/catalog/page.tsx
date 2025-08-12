

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import type { Product, GalleryImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogPage() {
  const router = useRouter();
  const { currentUser, allPublications } = useCorabo();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  
  const products = useMemo(() => {
    if (!currentUser) return [];
    
    // FORENSIC FIX: The component was reading from currentUser.gallery, which was out of sync.
    // It should read from `allPublications` (the single source of truth from the context)
    // and filter by the current user's ID.
    return allPublications
        .filter(item => item.providerId === currentUser.id && item.type === 'product' && item.productDetails)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(item => ({
            id: item.id,
            name: item.productDetails!.name,
            description: item.description,
            price: item.productDetails!.price,
            category: item.productDetails!.category,
            providerId: item.providerId,
            imageUrl: item.src,
        }));
  }, [currentUser, allPublications]);

  useEffect(() => {
    if (currentUser) {
        // We set loading to false once the context has loaded the user and publications.
        setIsLoading(allPublications.length === 0);
    }
  }, [currentUser, allPublications]);
  
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

