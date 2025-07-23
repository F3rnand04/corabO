"use client";

import { useSearchParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { ProductCard } from '@/components/ProductCard';

export default function ProductsPage() {
    const { products } = useCorabo();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');

    const filteredProducts = category
        ? products.filter(p => p.category === category)
        : products;

    return (
        <main className="container py-8">
            <h1 className="text-3xl font-bold mb-2">
                {category ? `Productos de ${category}` : 'Todos los Productos'}
            </h1>
            <p className="text-muted-foreground mb-8">Explora nuestro catálogo de productos disponibles.</p>
            
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No hay productos en esta categoría.</p>
                </div>
            )}
        </main>
    );
}
