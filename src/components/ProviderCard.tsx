"use client";

import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User as UserType } from "@/lib/types";
import { Star, MapPin, Bookmark, Send, MessageCircle } from "lucide-react";

interface ProviderCardProps {
    provider: UserType;
}

export function ProviderCard({ provider }: ProviderCardProps) {
    return (
        <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 border">
                        <AvatarFallback className="text-xs">Foto</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{provider.name}</p>
                                <p className="text-sm text-muted-foreground">Especialidad</p>
                            </div>
                            <Badge variant="destructive" className="bg-red-500 text-white">HOY 10% Off</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-foreground">{provider.reputation}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <span>99.9% Efec.</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>00 | 05</span>
                        </div>
                    </div>
                     <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span className="text-xs">2.5 km</span>
                    </div>
                     <Button variant="ghost" size="icon" className="shrink-0">
                        <Bookmark className="w-5 h-5" />
                    </Button>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden my-3">
                    <Image src="https://placehold.co/600x400.png" alt="Provider content" layout="fill" objectFit="cover" data-ai-hint="landscape nature" />
                    <div className="absolute bottom-2 right-2 flex flex-col items-center gap-2">
                        <div className="flex flex-col items-center text-white">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full">
                                <Star className="w-5 h-5" />
                            </Button>
                            <span className="text-xs font-bold mt-1">4.5k</span>
                        </div>
                        <div className="flex flex-col items-center text-white mt-2">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full">
                                <MessageCircle className="w-5 h-5" />
                             </Button>
                            <span className="text-xs font-bold mt-1">8.9k</span>
                        </div>
                         <div className="flex flex-col items-center text-white mt-2">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full">
                                <Send className="w-5 h-5" />
                             </Button>
                            <span className="text-xs font-bold mt-1">1.2k</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-around items-center">
                    <Button variant="ghost" className="text-muted-foreground font-semibold">Mensaje</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" className="text-muted-foreground font-semibold">Ver Perfil</Button>
                     <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" className="text-muted-foreground font-semibold">Comentarios</Button>
                </div>
            </CardContent>
        </Card>
    )
}