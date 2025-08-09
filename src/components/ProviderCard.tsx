
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User as UserType } from "@/lib/types";
import { Star, MapPin, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { PublicationCard } from "./PublicationCard";

interface ProviderCardProps {
    provider: UserType & { galleryItem: NonNullable<UserType['gallery']>[0] };
}

export function ProviderCard({ provider }: ProviderCardProps) {
    const { sendMessage, getUserMetrics } = useCorabo();
    const router = useRouter();
    
    const profileLink = `/companies/${provider.id}`;

    const handleDirectMessage = () => {
      const conversationId = sendMessage(provider.id, '', true);
      router.push(`/messages/${conversationId}`);
    };
    
    const { reputation, effectiveness, responseTime } = getUserMetrics(provider.id);
    const isNewProvider = responseTime === 'Nuevo';

    const displayName = provider.profileSetupData?.useUsername 
        ? provider.profileSetupData.username || provider.name 
        : provider.name;
    const specialty = provider.profileSetupData?.specialty || "Especialidad del Proveedor";
    
    const displayDistance = provider.profileSetupData?.showExactLocation ? "A menos de 1km" : "500m - 1km";
    
    const mainImage = provider.galleryItem;
    if (!mainImage) return null;

    return (
        <Card className="rounded-2xl overflow-hidden shadow-md">
            <CardContent className="p-0">
                <div className="p-3">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                             <AvatarImage src={provider.profileImage} alt={displayName} />
                             <AvatarFallback className="text-xs">{displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <Link href={profileLink} passHref>
                                <div className="flex items-center gap-2 cursor-pointer group">
                                    <p className="font-bold text-base group-hover:underline">{displayName}</p>
                                    {provider.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                </div>
                            </Link>
                             <p className="text-sm text-muted-foreground">{specialty}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                {isNewProvider ? (
                                    <Badge variant="secondary">Nuevo</Badge>
                                ) : (
                                    <>
                                        <span>{effectiveness.toFixed(0)}% Efec.</span>
                                        <Separator orientation="vertical" className="h-4" />
                                        <span className="text-green-600 font-semibold">{responseTime}</span>
                                    </>
                                )}
                            </div>
                        </div>
                         <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <MapPin className={cn("w-5 h-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
                            <span className="text-xs font-semibold">{displayDistance}</span>
                        </div>
                    </div>
                </div>

                <PublicationCard publication={mainImage} owner={provider} />

                 <div className="flex justify-around items-center border-t">
                    <Button variant="ghost" className="flex-1 text-muted-foreground font-semibold text-sm rounded-none h-12" onClick={handleDirectMessage}>
                        Mensaje
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Link href={profileLink} passHref className="flex-1">
                        <Button variant="ghost" className="w-full text-muted-foreground font-semibold text-sm rounded-none h-12">
                            Ver Perfil
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
