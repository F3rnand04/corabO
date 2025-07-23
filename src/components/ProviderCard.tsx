"use client";

import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User as UserType } from "@/lib/types";
import { Star, MapPin, Bookmark, Send, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";

interface ProviderCardProps {
    provider: UserType;
}

export function ProviderCard({ provider }: ProviderCardProps) {
    const { addContact } = useCorabo();
    const profileLink = provider.type === 'provider' ? `/companies/${provider.id}` : '#';

    const handleSaveContact = () => {
        addContact(provider);
    };

    return (
        <Card className="rounded-2xl overflow-hidden shadow-md">
            <CardContent className="p-0">
                <div className="p-3">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                             <AvatarFallback className="text-xs">Foto</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-base">{provider.name}</p>
                                    <p className="text-sm text-muted-foreground">Especialidad del Proveedor</p>
                                </div>
                                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" onClick={handleSaveContact}>
                                    <Bookmark className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-semibold text-foreground">{provider.reputation}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <span>99.9% Efec.</span>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="text-green-600 font-semibold">00-05 min</span>
                            </div>
                        </div>
                         <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <MapPin className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-semibold">2.5 km</span>
                        </div>
                    </div>
                </div>

                <div className="relative aspect-video w-full">
                    <Image src="https://placehold.co/600x400.png" alt="Provider content" layout="fill" objectFit="cover" data-ai-hint="service person working" />
                     <Badge variant="destructive" className="absolute top-2 left-2 bg-red-500 text-white shadow-lg">HOY 10% Off</Badge>
                    <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                        <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                                <Star className="w-5 h-5" />
                            </Button>
                            <span className="text-xs font-bold mt-1 drop-shadow-md">4.5k</span>
                        </div>
                        <div className="flex flex-col items-center">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                                <MessageCircle className="w-5 h-5" />
                             </Button>
                            <span className="text-xs font-bold mt-1 drop-shadow-md">8.9k</span>
                        </div>
                         <div className="flex flex-col items-center">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                                <Send className="w-5 h-5" />
                             </Button>
                            <span className="text-xs font-bold mt-1 drop-shadow-md">1.2k</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-around items-center p-2 border-t">
                    <Button variant="ghost" className="text-muted-foreground font-semibold text-sm">Mensaje</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Link href={profileLink} passHref>
                        <Button variant="ghost" className="text-muted-foreground font-semibold text-sm">Ver Perfil</Button>
                    </Link>
                     <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" className="text-muted-foreground font-semibold text-sm">Comentarios</Button>
                </div>
            </CardContent>
        </Card>
    )
}
