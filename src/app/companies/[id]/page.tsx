"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProductCard } from '@/components/ProductCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyProfilePage({ params }: { params: { id: string } }) {
    const { users, products } = useCorabo();
    
    const company = users.find(u => u.id === params.id && u.type === 'provider');
    const companyProducts = products.filter(p => p.providerId === params.id);

    if (!company) {
        return (
            <main className="container flex items-center justify-center py-20 text-center">
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">Empresa no encontrada</h1>
                    <p className="text-muted-foreground">La empresa que buscas no existe o no es un proveedor.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="container py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                    <div className="p-6 border rounded-lg flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 border-4 border-primary mb-4">
                             <AvatarImage src={`https://i.pravatar.cc/150?u=${company.id}`} alt={company.name} />
                            <AvatarFallback className="text-3xl">{company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-2xl font-bold">{company.name}</h1>
                        <p className="text-muted-foreground">Especialidad de la Empresa</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground my-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-semibold text-foreground">{company.reputation}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <span>99.9% Efec.</span>
                        </div>
                        <Button className="w-full">
                            <MessageCircle className="mr-2 h-4 w-4" /> Mensaje
                        </Button>
                    </div>
                </div>
                <div className="w-full md:w-2/3">
                    <h2 className="text-2xl font-bold mb-4">Productos</h2>
                     {companyProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {companyProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>Esta empresa no tiene productos disponibles actualmente.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
