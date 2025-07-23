"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Calendar, Wallet, MapPin, Share, Home, PlayCircle, ArrowUp, MessageSquare, Settings, Plus } from "lucide-react";
import Image from "next/image";
import { useCorabo } from "@/contexts/CoraboContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { currentUser } = useCorabo();
    const router = useRouter();

    useEffect(() => {
        // Redirect client users to the homepage
        if (currentUser.type === 'client') {
            router.push('/');
        }
    }, [currentUser, router]);

    // Show a loading state or null while redirecting
    if (currentUser.type !== 'provider') {
        return (
             <main className="container py-8">
                <h1 className="text-3xl font-bold">Cargando...</h1>
                <p className="text-muted-foreground">Redirigiendo a la página principal.</p>
            </main>
        )
    }


    return (
        <div className="bg-background min-h-screen flex flex-col">
            {/* Main Content */}
            <main className="flex-grow pb-20">
                {/* Profile Header */}
                <div className="p-4 bg-card">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="w-20 h-20 border-2 border-muted">
                                 <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                                 <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="outline" className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-background hover:bg-muted">
                                <Plus className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex-grow">
                             <h1 className="text-lg font-bold">{currentUser.name}</h1>
                             <p className="text-sm text-muted-foreground">Especialidad</p>
                             <div className="flex items-center gap-2 text-sm mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span>4.9</span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <span>99.9% Efec.</span>
                                 <Separator orientation="vertical" className="h-4" />
                                <span className="text-green-600 font-semibold">00 | 05</span>
                             </div>
                        </div>
                         <div className="flex gap-2">
                            <Button variant="ghost" size="icon"><Calendar className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon"><Wallet className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon"><MapPin className="w-5 h-5" /></Button>
                        </div>
                    </div>
                     <div className="flex justify-around mt-4 text-center text-sm">
                        <div>
                            <p className="font-bold text-lg">30</p>
                            <p className="text-muted-foreground">Publicaciones</p>
                        </div>
                         <div>
                            <p className="font-bold text-lg">15</p>
                            <p className="text-muted-foreground">Trab. Realizados</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 mt-2">
                     <Button className="w-full bg-muted text-muted-foreground font-semibold hover:bg-muted/80">GESTION DE CAMPAÑAS</Button>
                </div>
                

                {/* Main Image */}
                <div className="mt-4 px-4 relative">
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden">
                        <Image src="https://placehold.co/600x450.png" alt="Main content" layout="fill" objectFit="cover" data-ai-hint="professional service landscape" />
                    </div>
                    <div className="absolute bottom-4 right-6 flex flex-col items-center gap-4 text-white">
                       <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-black bg-white/70 backdrop-blur-sm rounded-full h-10 w-10 hover:bg-white/90">
                                <Share className="w-5 h-5" />
                            </Button>
                            <span className="text-xs font-bold mt-1 text-black drop-shadow-md">4567</span>
                        </div>
                       <div className="flex flex-col items-center">
                             <Button variant="ghost" size="icon" className="text-black bg-white/70 backdrop-blur-sm rounded-full h-10 w-10 hover:bg-white/90">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                             </Button>
                            <span className="text-xs font-bold mt-1 text-black drop-shadow-md">8934.5</span>
                        </div>
                    </div>
                </div>

                {/* Promotions */}
                <div className="mt-4 px-4">
                    <div className="flex justify-between items-center">
                         <h2 className="font-bold text-lg">Promoción del Día</h2>
                         <Button variant="link" className="text-muted-foreground">Editar Descripción</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                <Image src={`https://placehold.co/300x300.png?text=Promo${i+1}`} alt={`Promotion ${i+1}`} layout="fill" objectFit="cover" data-ai-hint="promotional product" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Custom Footer */}
            <footer className="bg-card border-t fixed bottom-0 w-full z-40">
                <div className="container flex justify-around h-16 items-center px-2">
                     <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                        <Home className="h-6 w-6" />
                    </Button>
                     <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                        <PlayCircle className="h-6 w-6" />
                    </Button>
                    
                    <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full shadow-lg -translate-y-4 bg-muted hover:bg-muted/80 ring-4 ring-background">
                        <ArrowUp className="h-7 w-7 text-muted-foreground" />
                    </Button>

                     <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                        <MessageSquare className="h-6 w-6" />
                    </Button>

                     <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
                        <Settings className="h-6 w-6" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
