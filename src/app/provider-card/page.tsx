

"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User as UserType } from "@/lib/types";
import { Star, MapPin, Bookmark, Send, MessageCircle, CheckCircle, Flag } from "lucide-react";
import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";
import { useState } from "react";
import { ReportDialog } from "@/components/ReportDialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageDetailsDialog } from "@/components/ImageDetailsDialog";
import { useToast } from "@/hooks/use-toast";


interface ProviderCardProps {
    provider: UserType;
}

export function ProviderCard({ provider }: ProviderCardProps) {
    const { addContact, sendMessage, products } = useCorabo();
    const router = useRouter();
    const { toast } = useToast();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const profileLink = provider.type === 'provider' ? `/companies/${provider.id}` : '#';

    const handleSaveContact = () => {
        const success = addContact(provider);
        if (success) {
            toast({
                title: "¡Contacto Guardado!",
                description: `Has añadido a ${provider.name} a tus contactos.`
            });
        } else {
            toast({
                title: "Contacto ya existe",
                description: `${provider.name} ya está en tu lista de contactos.`
            });
        }
    };

    const handleDirectMessage = () => {
      const conversationId = sendMessage(provider.id, '', true);
      router.push(`/messages/${conversationId}`);
    };

    const isPromotionActive = provider.promotion && new Date(provider.promotion.expires) > new Date();

    const displayName = provider.profileSetupData?.useUsername 
        ? provider.profileSetupData.username || provider.name 
        : provider.name;
    const specialty = provider.profileSetupData?.specialty || "Especialidad del Proveedor";
    
    const displayDistance = provider.profileSetupData?.showExactLocation ? "A menos de 1km" : "500m - 1km";

    const mainImage = provider.gallery && provider.gallery.length > 0 ? provider.gallery[0].src : "https://placehold.co/600x400.png";
    const mainImageAlt = provider.gallery && provider.gallery.length > 0 ? provider.gallery[0].alt : displayName;
    
    const providerProductsCount = products.filter(p => p.providerId === provider.id).length;


    return (
        <>
        <Card className="rounded-2xl overflow-hidden shadow-md">
            <CardContent className="p-0">
                <div className="p-3">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                             <AvatarImage src={provider.profileImage} alt={displayName} />
                             <AvatarFallback className="text-xs">{displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <Link href={profileLink} passHref>
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                        <p className="font-bold text-base group-hover:underline">{displayName}</p>
                                        {provider.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" onClick={handleSaveContact}>
                                    <Bookmark className="w-5 h-5" />
                                </Button>
                            </div>
                             <p className="text-sm text-muted-foreground">{specialty}</p>
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
                            <MapPin className={cn("w-5 h-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
                            <span className="text-xs font-semibold">{displayDistance}</span>
                        </div>
                    </div>
                </div>

                <div className="relative aspect-video w-full group" onDoubleClick={() => setIsDetailsDialogOpen(true)}>
                    <Image src={mainImage} alt={mainImageAlt} layout="fill" objectFit="cover" data-ai-hint="service person working" />
                    
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 left-2 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsReportDialogOpen(true)}
                        >
                        <Flag className="w-4 h-4" />
                    </Button>

                    {isPromotionActive && provider.promotion && (
                        <Badge variant="destructive" className="absolute top-2 right-2 bg-red-500 text-white shadow-lg">{provider.promotion.text}</Badge>
                    )}
                    <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                        <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                                <Star className="w-5 h-5" />
                            </Button>
                            <span className="text-xs font-bold mt-1 drop-shadow-md">4.5k</span>
                        </div>
                        <div className="flex flex-col items-center">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10" onClick={() => setIsDetailsDialogOpen(true)}>
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
                    <Button variant="ghost" className="text-muted-foreground font-semibold text-sm" onClick={handleDirectMessage}>Mensaje</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Link href={profileLink} passHref>
                        <Button variant="ghost" className="text-muted-foreground font-semibold text-sm">Ver Perfil</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
        <ReportDialog 
            isOpen={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen} 
            providerId={provider.id} 
            publicationId="provider-img" 
        />
        {provider.gallery && provider.gallery.length > 0 && (
            <ImageDetailsDialog
                isOpen={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
                gallery={provider.gallery}
                owner={provider}
                startIndex={0}
            />
        )}
        </>
    )
}
