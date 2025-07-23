"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProductCard } from '@/components/ProductCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, MessageCircle, Grid3x3, Shirt, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CompanyProfilePage({ params }: { params: { id: string } }) {
    const { users, products, services } = useCorabo();
    
    const company = users.find(u => u.id === params.id && u.type === 'provider');
    const companyProducts = products.filter(p => p.providerId === params.id);
    const companyServices = services.filter(s => s.providerId === params.id);

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

    const stats = [
        { name: 'Artículos', value: companyProducts.length },
        { name: 'Servicios', value: companyServices.length },
        { name: 'Reputación', value: company.reputation, icon: Star },
    ];

    return (
        <main className="container py-8">
            <div className="flex flex-col gap-8 items-center w-full">
                {/* Profile Header */}
                <div className="w-full max-w-2xl">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-primary">
                             <AvatarImage src={`https://i.pravatar.cc/150?u=${company.id}`} alt={company.name} />
                            <AvatarFallback className="text-4xl">{company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-4 text-center sm:text-left">
                            <h1 className="text-3xl font-bold">{company.name}</h1>
                            <p className="text-muted-foreground">Especialidad de la Empresa. Breve descripción sobre lo que hacen y su propuesta de valor.</p>
                            <div className="flex justify-center sm:justify-start gap-2">
                                <Button>
                                    <MessageCircle className="mr-2 h-4 w-4" /> Mensaje
                                </Button>
                                <Button variant="outline">Seguir</Button>
                            </div>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex justify-around text-center">
                        {stats.map(stat => (
                             <div key={stat.name} className="flex flex-col items-center gap-1">
                                <p className="text-xl font-bold">{stat.value}</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {stat.icon && <stat.icon className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                    <span>{stat.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="w-full">
                    <Tabs defaultValue="products" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                            <TabsTrigger value="products">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Productos
                            </TabsTrigger>
                            <TabsTrigger value="services">
                                <Shirt className="mr-2 h-4 w-4" />
                                Servicios
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="products" className="mt-6">
                             {companyProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                                    {companyProducts.map(product => (
                                        <div key={product.id} className="relative aspect-square overflow-hidden rounded-md group">
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" data-ai-hint="product technology"/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                                <p className="text-white text-center text-sm font-semibold">{product.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>Esta empresa no tiene productos disponibles actualmente.</p>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="services" className="mt-6">
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Esta empresa no tiene servicios disponibles actualmente.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </main>
    );
}