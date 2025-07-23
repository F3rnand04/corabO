
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Calendar, Wallet, MapPin, Share, Home, PlayCircle, ArrowUp, MessageSquare, Settings, Plus, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useCorabo } from "@/contexts/CoraboContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CloudUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" {...props}>
        <path d="M144 480C64.5 480 0 415.5 0 336c0-68.9 48.2-126.5 112.2-140.9c29.1-64.5 95.5-107.1 168.8-107.1c9.1 0 18.1 .8 27 2.2c-2.9-13.4-4.3-27.2-4.3-41.2c0-97.2 78.8-176 176-176c82.3 0 152.3 56.4 170.8 132.8c34.3 15.2 58 49.3 58 88.2c0 53-43 96-96 96H416c0 17.7-14.3 32-32 32s-32-14.3-32-32H144zM320 256c-12.5 0-24.2 4.8-33.2 13.2l-64 59.7c-17.7 16.5-18.6 44.2-2.1 61.8s44.2 18.6 61.8 2.1l23.5-22v102.1c0 23.5 19.1 42.7 42.7 42.7s42.7-19.1 42.7-42.7V370.8l23.5 22c17.7 16.5 45.4 15.6 61.8-2.1s15.6-45.4-2.1-61.8l-64-59.7c-9-8.4-20.7-13.2-33.2-13.2z" />
    </svg>
);


export default function ProfilePage() {
    const { currentUser } = useCorabo();
    const router = useRouter();

    useEffect(() => {
        if (currentUser.type === 'client') {
            router.push('/');
        }
    }, [currentUser, router]);

    if (currentUser.type !== 'provider') {
        return (
            <main className="container py-8">
                <h1 className="text-3xl font-bold">Cargando...</h1>
                <p className="text-muted-foreground">Redirigiendo si es necesario...</p>
            </main>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            
            {/* Header Section */}
            <header className="bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                           <Avatar className="w-20 h-20 border-2 border-muted">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <button className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-6 h-6 flex justify-center items-center text-lg border-2 border-white">
                                +
                            </button>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">{currentUser.name.toUpperCase()}</h1>
                            <p className="text-sm text-gray-600">ESPECIALIDAD</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Calendar className="text-gray-500 h-6 w-6" />
                        <Wallet className="text-gray-500 h-6 w-6" />
                        <MapPin className="text-gray-500 h-6 w-6" />
                    </div>
                </div>
            </header>

            {/* Stats Section */}
            <section className="bg-white p-4 flex justify-around items-center text-center text-gray-700 border-t">
                <div className="flex items-center space-x-1">
                    <Star className="text-yellow-400 fill-yellow-400 h-5 w-5" />
                    <span className="font-medium">4.9</span>
                </div>
                <div className="px-2">
                    <p className="font-medium">99.9%</p>
                    <p className="text-xs text-gray-500">Efec.</p>
                </div>
                 <div className="px-2">
                    <p className="font-medium">00 | 05</p>
                    <p className="text-xs text-gray-500">Trab. Realizados</p>
                </div>
                <div className="px-2">
                    <p className="font-medium">30</p>
                    <p className="text-xs text-gray-500">Publicaciones</p>
                </div>
                <div className="px-2">
                    <p className="font-medium">15</p>
                    <p className="text-xs text-gray-500">Trab. Realizados</p>
                </div>
            </section>
            
            {/* Campaign Management Button */}
            <div className="p-4 flex justify-end">
                <Button className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
                    GESTION DE CAMPAÑAS
                </Button>
            </div>


            {/* Main Content Section */}
            <main className="flex-grow p-4 space-y-4">
                 <div className="bg-white rounded-xl shadow-md p-4 relative">
                    <div className="relative bg-blue-100 aspect-[4/2.5] w-full rounded-lg overflow-hidden flex items-center justify-center">
                        <Image src="https://placehold.co/600x375.png" alt="Main content" layout="fill" objectFit="cover" data-ai-hint="professional service landscape" />
                    </div>
                     <div className="absolute top-6 right-6 flex flex-col items-center space-y-1">
                         <Share className="text-gray-600 h-6 w-6" />
                         <span className="text-xs text-gray-600">4567</span>
                     </div>
                     <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-1">
                         <Star className="text-yellow-400 fill-yellow-400 h-7 w-7" />
                         <span className="text-sm text-gray-700 font-semibold">8934.5</span>
                     </div>
                 </div>
                 
                 <div className="flex justify-around text-gray-700 font-medium text-lg mb-4">
                     <span className="border-b-2 border-green-500 pb-1">Promoción del Día</span>
                     <span>Editar Descripción</span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                     {Array.from({ length: 6 }).map((_, i) => (
                         <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-blue-100">
                             <Image src={`https://placehold.co/300x300.png?text=Promo${i+1}`} alt={`Promotion ${i+1}`} layout="fill" objectFit="cover" data-ai-hint="promotional product" />
                         </div>
                     ))}
                 </div>
            </main>

            {/* Custom Bottom Navigation Bar */}
            <footer className="bg-white p-4 flex justify-around items-center border-t border-gray-200 shadow-lg fixed bottom-0 w-full z-40">
                <Home className="h-7 w-7 text-gray-500" />
                <PlayCircle className="h-7 w-7 text-gray-500" />
                <div className="relative">
                     <button className="bg-white rounded-full p-2 shadow-md -translate-y-6">
                        <CloudUploadIcon className="h-10 w-10 text-green-500 fill-current" />
                     </button>
                </div>
                <MessageSquare className="h-7 w-7 text-gray-500" />
                <Settings className="h-7 w-7 text-gray-500" />
            </footer>
        </div>
    );
}

