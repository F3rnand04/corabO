"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import {
  ArrowUp,
  Calendar,
  Home,
  MapPin,
  MessageSquare,
  PlayCircle,
  Plus,
  Settings,
  Share2,
  Star,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <p>Redirigiendo...</p>
            </main>
        );
    }
  
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{currentUser.name}</h1>
              <p className="text-sm text-gray-500">Especialidad del Proveedor</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="text-gray-500" />
            <Wallet className="text-gray-500" />
            <MapPin className="text-gray-500" />
          </div>
        </div>
        <div className="mt-4 flex justify-around items-center text-center text-sm">
           <div className="flex items-center space-x-1">
             <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
             <span className="font-medium">{currentUser.reputation}</span>
           </div>
           <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">99.9%</p>
             <p className="text-xs text-gray-500">Efec.</p>
           </div>
            <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">00 | 05</p>
             <p className="text-xs text-gray-500">Trab. Realizados</p>
           </div>
            <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">30</p>
             <p className="text-xs text-gray-500">Publicaciones</p>
           </div>
        </div>
      </header>

      {/* Campaign Button */}
      <div className="p-4 flex justify-end">
        <Button className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full text-xs font-medium shadow-md h-8">
          GESTION DE CAMPAÑAS
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-grow p-4 space-y-6 pb-24">
        <Card className="rounded-xl shadow-md overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="relative w-full h-64">
              <Image src="https://placehold.co/600x400/a7d9ed/ffffff?text=" alt="Promotional" layout="fill" objectFit="cover" data-ai-hint="landscape abstract" />
              <div className="absolute top-4 right-4 flex flex-col items-center space-y-4">
                  <div className="flex flex-col items-center">
                    <Share2 className="text-gray-700 w-6 h-6" />
                    <span className="text-xs text-gray-700 font-semibold">4567</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Star className="text-yellow-400 fill-yellow-400 w-7 h-7" />
                    <span className="text-sm text-gray-700 font-semibold">8934.5</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-around text-gray-700 font-medium text-md">
            <span className="border-b-2 border-green-500 pb-1 text-black font-semibold">Promoción del Día</span>
            <span className="text-gray-500">Editar Descripción</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="relative aspect-square">
                     <Image src="https://placehold.co/200x200/a7d9ed/ffffff?text=" layout="fill" objectFit="cover" className="rounded-lg" alt={`promo ${i+1}`} data-ai-hint="landscape abstract" />
                </div>
            ))}
        </div>
      </main>

      {/* Custom Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-around items-center border-t border-gray-200 shadow-lg z-50">
        <Button variant="ghost" className="flex-col h-auto p-1">
            <Home className="w-6 h-6 text-gray-500" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <PlayCircle className="w-6 h-6 text-gray-500" />
        </Button>
        <div className="relative">
            <Button size="icon" className="relative -top-5 w-16 h-16 bg-white rounded-full shadow-lg border-4 border-background hover:bg-gray-100">
                <ArrowUp className="w-8 h-8 text-green-500" />
            </Button>
        </div>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <MessageSquare className="w-6 h-6 text-gray-500" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <Settings className="w-6 h-6 text-gray-500" />
        </Button>
      </nav>
    </div>
  );
}