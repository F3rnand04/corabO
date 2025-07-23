"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Wallet, MapPin, BadgePercent, Star, PlusCircle, Image as ImageIcon, Trash2, Settings, Home, PlayCircle, MessageSquare, ArrowUp } from 'lucide-react';
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

    const galleryImages = [
        ...providerProducts.map(p => p.imageUrl),
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
        "https://placehold.co/600x400.png",
    ].slice(0, 9);


    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="px-3 pt-3">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-xl">corabO</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon"><Wallet className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleGps} className={isGpsActive ? 'text-primary' : ''}><MapPin className="h-5 w-5"/></Button>
                    </div>
                </div>
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
                    <div className="flex-grow space-y-1">
                        <h1 className="text-lg font-bold">{currentUser.name}</h1>
                        <p className="text-sm text-muted-foreground">Especialidad</p>
                        <div className="flex items-center gap-1 text-sm">
                             <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-bold">{currentUser.reputation}</span>
                            <span className="text-muted-foreground">| 99.9% Efectividad</span>
                        </div>
                        <div className="flex justify-start gap-6 text-center text-sm mt-1">
                            <div>
                                <p className="font-bold">{providerProducts.length}</p>
                                <p className="text-xs text-muted-foreground">Publicaciones</p>
                            </div>
                            <div>
                                <p className="font-bold">{completedJobs}</p>
                                <p className="text-xs text-muted-foreground">Trabajos Realizados</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="mt-3">
                    <Button className="w-full" variant="outline">Ofrecer Promoción</Button>
                </div>
            </header>

            <main className="flex-grow container py-4 px-2 space-y-4">
                <Card className="bg-muted">
                    <CardContent className="p-2">
                        <div className="relative aspect-video w-full rounded-md overflow-hidden flex items-center justify-center bg-gray-200">
                           <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs h-8">Promoción de Hoy</Button>
                    <Button className="flex-1 text-xs h-8">Destacar esta imagen</Button>
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                    {galleryImages.map((imgSrc, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-sm group bg-muted flex items-center justify-center">
                             <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    ))}
                </div>
            </main>
            
            <footer className="bg-background border-t sticky bottom-0 z-40">
              <div className="container flex justify-around h-16 items-center px-2">
                <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => window.location.href='/'}>
                  <Home className="h-6 w-6" />
                  <span className="text-xs">Home</span>
                </Button>
                <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                  <PlayCircle className="h-6 w-6" />
                   <span className="text-xs">Como se Hace</span>
                </Button>
                
                <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90">
                    <ArrowUp className="h-7 w-7" />
                </Button>

                <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                  <MessageSquare className="h-6 w-6" />
                   <span className="text-xs">Mensajeria</span>
                </Button>

                <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => { /* Navigate to settings */ }}>
                  <Settings className="h-6 w-6" />
                  <span className="text-xs">Ajustes</span>
                </Button>
              </div>
            </footer>
        </div>
    );
}
