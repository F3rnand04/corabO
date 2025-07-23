"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProviderCard } from '@/components/ProviderCard';
import { Map, SlidersHorizontal } from 'lucide-react';

export default function MapPage() {
    const { users } = useCorabo();
    const providers = users.filter(u => u.type === 'provider');

    // Posiciones simuladas para los avatares en el mapa
    const providerPositions = [
        { top: '20%', left: '30%' },
        { top: '50%', left: '50%' },
        { top: '65%', left: '25%' },
        { top: '35%', left: '70%' },
    ];

    return (
        <main className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Map className="h-8 w-8 text-primary" />
                    Mapa de Servicios
                </h1>
                <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filtros
                </Button>
            </div>
            
            <Card className="mb-8">
                <CardContent className="p-0">
                    <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                        <Image
                            src="https://placehold.co/1200x800.png"
                            alt="Mapa de la ciudad"
                            layout="fill"
                            objectFit="cover"
                            className="opacity-50"
                            data-ai-hint="city map"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                        </div>

                        {/* Simulación de pines de proveedores */}
                        {providers.slice(0, providerPositions.length).map((provider, index) => (
                            <Avatar 
                                key={provider.id}
                                className="absolute w-12 h-12 border-4 border-white shadow-lg"
                                style={providerPositions[index]}
                            >
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${provider.id}`} alt={provider.name} />
                                <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold mb-4">Proveedores Cercanos (Simulado)</h2>
                <div className="space-y-4">
                    {providers.map(provider => (
                        <ProviderCard key={provider.id} provider={provider} />
                    ))}
                </div>
            </div>
        </main>
    );
}
