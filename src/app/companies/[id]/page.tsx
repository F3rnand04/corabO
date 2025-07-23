"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, ShoppingBag, Shirt, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

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
        { name: 'Publicaciones', value: companyProducts.length },
        { name: 'Efectividad', value: '99.9%' },
        { name: 'Reputación', value: company.reputation, icon: Star },
    ];

    return (
        <main className="container py-4 px-2">
            <div className="flex flex-col gap-4 w-full">
                {/* Profile Header */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/">
                                <ChevronLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-bold">{company.name}</h1>
                        <div className="w-8"></div>
                    </div>

                    <div className="flex items-start gap-4">
                        <Avatar className="w-20 h-20 border-2 border-primary">
                             <AvatarImage src={`https://i.pravatar.cc/150?u=${company.id}`} alt={company.name} />
                            <AvatarFallback className="text-3xl">{company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-2">
                             <div className="flex justify-around text-center my-4">
                                {stats.map(stat => (
                                     <div key={stat.name} className="flex flex-col items-center gap-1">
                                        <p className="text-md font-bold">{stat.value}</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            {stat.icon && <stat.icon className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                            <span>{stat.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="font-bold">{company.name}</p>
                        <p className="text-sm text-muted-foreground">Especialidad de la Empresa</p>
                    </div>

                     <div className="flex justify-center gap-2 mt-4">
                        <Button className="flex-1">
                            <MessageCircle className="mr-2 h-4 w-4" /> Mensaje
                        </Button>
                        <Button variant="outline" className="flex-1">Seguir</Button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="w-full mt-4">
                    <Tabs defaultValue="products" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="products">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Productos
                            </TabsTrigger>
                            <TabsTrigger value="services">
                                <Shirt className="mr-2 h-4 w-4" />
                                Servicios
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="products" className="mt-4">
                             {companyProducts.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1">
                                    {companyProducts.map(product => (
                                        <div key={product.id} className="relative aspect-square overflow-hidden rounded-sm group">
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" data-ai-hint="product technology"/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                                                <p className="text-white text-center text-xs font-semibold">{product.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>Esta empresa no tiene productos disponibles.</p>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="services" className="mt-4">
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Esta empresa no tiene servicios disponibles.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </main>
    );
}
