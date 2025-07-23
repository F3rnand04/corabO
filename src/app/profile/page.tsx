"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Star, Calendar, Wallet, MapPin, Plus, Share2, Home, Video, Upload, MessageSquare, Settings, CheckCircle } from "lucide-react";

export default function ProfilePage() {
    const { currentUser, isGpsActive } = useCorabo();

    if (currentUser.type !== 'provider') {
        return (
            <main className="container py-8">
                <h1 className="text-3xl font-bold">Perfil de Cliente</h1>
                <p className="text-muted-foreground">Esta página está en construcción para los clientes.</p>
            </main>
        );
    }

    const stats = {
        rating: 4.9,
        effectiveness: "99.9%",
        responseTime: "00 | 05",
        publications: 30,
        completedWorks: 15,
        shares: 4567,
        likes: 8934.5,
    };

    const promotions = [
        { id: 1, src: "https://placehold.co/300x300.png", hint: "office work" },
        { id: 2, src: "https://placehold.co/300x300.png", hint: "team meeting" },
        { id: 3, src: "https://placehold.co/300x300.png", hint: "building project" },
        { id: 4, src: "https://placehold.co/300x300.png", hint: "creative design" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header Section */}
            <header className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="w-20 h-20 border-2 border-muted">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-lg font-bold">{currentUser.name}</h1>
                                <p className="text-sm text-muted-foreground">Especialidad</p>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Calendar className="w-5 h-5" />
                                <Wallet className="w-5 h-5" />
                                <MapPin className={`w-5 h-5 ${isGpsActive ? 'text-green-500' : ''}`} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mt-2">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-semibold">{stats.rating}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{stats.effectiveness} Efec.</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-green-600 font-semibold">{stats.responseTime}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div><span className="font-bold text-foreground">{stats.publications}</span> Publicaciones</div>
                            <div><span className="font-bold text-foreground">{stats.completedWorks}</span> Trab. Realizados</div>
                        </div>
                    </div>
                </div>
                <Button className="w-full mt-4 rounded-full" variant="secondary">
                    GESTIÓN DE CAMPAÑAS
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-2">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted">
                    <Image src="https://placehold.co/600x450.png" layout="fill" objectFit="cover" alt="Promotional content" data-ai-hint="landscape nature"/>
                    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-4 text-white">
                        <div className="flex flex-col items-center">
                            <Share2 className="w-8 h-8 drop-shadow-lg" />
                            <span className="text-sm font-bold mt-1 drop-shadow-md">{stats.shares}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-lg" />
                            <span className="text-sm font-bold mt-1 drop-shadow-md">{stats.likes}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center py-4 px-2">
                    <h2 className="font-bold">Promoción del Día</h2>
                    <Button variant="link" className="text-primary">Editar Descripción</Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    {promotions.map(promo => (
                        <div key={promo.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                            <Image src={promo.src} layout="fill" objectFit="cover" alt={`Promotion ${promo.id}`} data-ai-hint={promo.hint} />
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="bg-background border-t sticky bottom-0 z-40">
                <div className="container flex justify-around h-16 items-center px-2">
                    <Button variant="ghost" className="flex-col h-auto p-1 text-primary">
                        <Home className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
                        <Video className="h-6 w-6" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full shadow-lg -translate-y-4">
                        <Upload className="h-7 w-7" />
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
                        <MessageSquare className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
                        <Settings className="h-6 w-6" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
