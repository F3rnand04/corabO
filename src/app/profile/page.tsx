"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Wallet, MapPin, BadgePercent, Star, PlusCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function ProviderProfilePage() {
    const { currentUser, products, transactions, toggleGps, isGpsActive } = useCorabo();

    if (currentUser.type !== 'provider') {
        return (
            <main className="container flex items-center justify-center py-20 text-center">
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                    <p className="text-muted-foreground">Esta sección es solo para proveedores.</p>
                </div>
            </main>
        );
    }
    
    const providerProducts = products.filter(p => p.providerId === currentUser.id);
    const completedJobs = transactions.filter(t => t.providerId === currentUser.id && t.status === 'Resuelto').length;

    const stats = [
        { name: 'Publicaciones', value: providerProducts.length },
        { name: 'Efectividad', value: '99.9%' },
        { name: 'Reputación', value: currentUser.reputation, icon: Star },
        { name: 'Trabajos Realizados', value: completedJobs },
    ];
    
    // Demo data for gallery
    const galleryImages = [
        ...providerProducts.map(p => p.imageUrl),
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
    ].slice(0, 9);


    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container py-4 px-2">
                <div className="flex flex-col gap-4 w-full">
                    {/* Profile Header */}
                    <div className="w-full">
                        <div className="flex items-start gap-3">
                            <div className="relative">
                                <Avatar className="w-20 h-20 border-2 border-primary">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                                    <AvatarFallback className="text-3xl">{currentUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Button size="icon" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-grow space-y-2">
                                <h1 className="text-lg font-bold">{currentUser.name}</h1>
                                <div className="flex justify-around text-center text-xs">
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="font-bold">{stats[0].value}</p>
                                        <p className="text-muted-foreground">{stats[0].name}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                         <p className="font-bold">{stats[3].value}</p>
                                        <p className="text-muted-foreground">{stats[3].name}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1">
                                            {stats[2].icon && <stats[2].icon className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                            <p className="font-bold">{stats[2].value}</p>
                                        </div>
                                        <p className="text-muted-foreground">{stats[2].name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Management Tools */}
                    <div className="flex justify-around items-center bg-muted p-2 rounded-lg">
                        <Button variant="ghost" size="icon" className="flex flex-col h-auto gap-1 text-muted-foreground">
                            <Calendar className="h-5 w-5" />
                            <span className="text-xs">Agenda</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="flex flex-col h-auto gap-1 text-muted-foreground">
                            <Wallet className="h-5 w-5" />
                            <span className="text-xs">Registro</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleGps} className={`flex flex-col h-auto gap-1 ${isGpsActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            <MapPin className="h-5 w-5" />
                            <span className="text-xs">Ubicación</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="flex flex-col h-auto gap-1 text-muted-foreground">
                            <BadgePercent className="h-5 w-5" />
                            <span className="text-xs">Ofertas</span>
                        </Button>
                    </div>

                    {/* Main Visual Portfolio */}
                    <Card>
                        <CardContent className="p-2 space-y-2">
                            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                                <Image src={providerProducts[0]?.imageUrl || 'https://placehold.co/600x400.png'} layout="fill" objectFit="cover" alt="Imagen Destacada" data-ai-hint="portfolio featured work"/>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 text-xs h-8">Promoción de Hoy</Button>
                                <Button className="flex-1 text-xs h-8">Destacar esta imagen</Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Portfolio Grid */}
                    <div>
                        <div className="grid grid-cols-3 gap-1">
                            {galleryImages.map((imgSrc, index) => (
                                <div key={index} className="relative aspect-square overflow-hidden rounded-sm group bg-muted">
                                    <Image src={imgSrc} alt={`Portfolio item ${index+1}`} layout="fill" objectFit="cover" data-ai-hint="portfolio work item" />
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Button variant="destructive" size="icon" className="h-6 w-6 bg-black/50">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
