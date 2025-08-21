
'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { GalleryImage, PublicationOwner, User, Product } from "@/lib/types";
import { Star, Bookmark, Send, MessageCircle, Flag, CheckCircle, MapPin, Plus, Heart } from "lucide-react";
import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";
import { useState, useEffect } from "react";
import { ReportDialog } from "./ReportDialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageDetailsDialog } from "./ImageDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import * as Actions from '@/lib/actions';


interface PublicationCardProps {
    publication: GalleryImage;
    className?: string;
}

export function PublicationCard({ publication, className }: PublicationCardProps) {
    const { isContact, currentUser, getUserMetrics, getDistanceToProvider } = useCorabo();
    const router = useRouter();
    const { toast } = useToast();
    
    // The owner is now passed directly in the publication prop.
    const owner = publication.owner as User | null;

    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(publication.likes || 0);
    const [shareCount, setShareCount] = useState(0);
    const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);

    useEffect(() => {
        if (!currentUser || !owner) return;
        setIsSaved(isContact(owner.id));
        setLikeCount(publication.likes || 0);
        setShareCount(0);
        setIsAvatarExpanded(false);
        // No need to fetch owner here anymore.
    }, [isContact, publication, currentUser, owner]);

    if (!owner || !owner.id) {
        // This can be a skeleton or null, but shouldn't happen if the backend enriches data correctly.
        return null; 
    }
    
    const isProduct = publication.type === 'product';
    const productDetails = publication.productDetails;

    const isWithinDeliveryRange = true; 

    const profileLink = `/companies/${owner.id}`;
    const { reputation, effectiveness, responseTime } = getUserMetrics(owner.id);
    const isNewProvider = responseTime === 'Nuevo';
    const distance = getDistanceToProvider(owner);

    const showLocationInfo = currentUser?.country === owner?.country;

    const displayName = owner.profileSetupData?.username || owner.name;
        
    const specialty = owner.profileSetupData?.specialty || "Especialidad no definida";
    const affiliation = owner.activeAffiliation;

    const handleSaveContact = () => {
        Actions.addContact(owner);
        setIsSaved(true);
        toast({
            title: "¡Contacto Guardado!",
            description: `Has añadido a ${owner.name} a tus contactos.`
        });
    };
    
    const handleLike = () => {
        setIsLiked(prev => !prev);
        setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    };

    const handleShare = async () => {
        const shareData = {
          title: `Mira esta publicación de ${owner.name}`,
          text: publication.description,
          url: window.location.origin + profileLink,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setShareCount(prev => prev + 1);
            } else {
                throw new Error("Share API not supported");
            }
        } catch (error) {
           navigator.clipboard.writeText(shareData.url);
           toast({
             title: "Enlace Copiado",
             description: "El enlace al perfil ha sido copiado.",
           });
        }
    }
    
    const handleAddToCart = () => {
        if (!isProduct || !productDetails || !currentUser) return;
        if (!currentUser.isTransactionsActive) {
            toast({
                variant: "destructive",
                title: "Acción Requerida",
                description: "Debes activar tu registro de transacciones para poder comprar."
            });
            return;
        }
        if (!isWithinDeliveryRange) {
             toast({
                variant: "destructive",
                title: "Fuera de Rango",
                description: "Este producto está fuera de tu rango de delivery."
            });
            return;
        }
        Actions.updateCart(currentUser.id, publication.id, 1);
        toast({ title: "Producto añadido", description: `${productDetails.name} fue añadido a tu carrito.` });
    };
    
    const handleContact = () => {
      if (!currentUser) return;
      const conversationId = [currentUser.id, owner.id].sort().join('-');
      Actions.sendMessage({ 
          senderId: currentUser.id,
          recipientId: owner.id, 
          conversationId: conversationId,
          text: `¡Hola! Me interesa tu publicación.`
      });
      router.push(`/messages/${conversationId}`);
    };
    
    return (
        <>
        <div className={cn("flex flex-col bg-card border-b", className)}>
            {/* Card Header */}
            <div className="flex items-start p-3 container">
                
                 <div className="relative flex-shrink-0 cursor-pointer" onClick={() => affiliation && setIsAvatarExpanded(!isAvatarExpanded)}>
                    <Link href={profileLink} passHref>
                        <Avatar className="w-12 h-12 transition-transform duration-300 ease-in-out" style={{ transform: isAvatarExpanded ? 'translateX(-16px)' : 'translateX(0)' }}>
                            <AvatarImage src={owner.profileImage} alt={owner.name} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    {affiliation && (
                        <>
                        <Link href={`/companies/${affiliation.companyId}`} passHref>
                            <Avatar className="w-12 h-12 border-2 border-background absolute top-0 left-0 transition-transform duration-300 ease-in-out" style={{ transform: isAvatarExpanded ? 'translateX(16px)' : 'translateX(0)', zIndex: isAvatarExpanded ? 10 : -1, opacity: isAvatarExpanded ? 1 : 0 }}>
                                <AvatarImage src={affiliation.companyProfileImage} alt={affiliation.companyName} />
                                <AvatarFallback>{affiliation.companyName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className={cn("w-5 h-5 bg-background rounded-full absolute -bottom-1 -right-1 flex items-center justify-center transition-opacity duration-200", isAvatarExpanded && "opacity-0")}>
                             <Image src={affiliation.companyProfileImage} alt={affiliation.companyName} width={18} height={18} className="rounded-full object-cover" />
                        </div>
                        </>
                    )}
                </div>

                <div className="flex-grow ml-3">
                    <div
                        className={cn("transition-transform duration-300 ease-in-out", isAvatarExpanded && "translate-y-2")}
                    >
                        <Link href={profileLink} passHref>
                            <p className="font-semibold text-sm hover:underline flex items-center gap-1.5">
                                {displayName}
                                {owner.isSubscribed && <CheckCircle className="w-4 h-4 text-blue-500" />}
                            </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{specialty}</p>
                    </div>

                    {isAvatarExpanded && affiliation && (
                         <Link href={`/companies/${affiliation.companyId}`} passHref>
                            <div className="transition-transform duration-300 ease-in-out -translate-y-2 cursor-pointer">
                                <p className="text-xs text-muted-foreground">Verificado por:</p>
                                <p className="font-semibold text-sm hover:underline">{affiliation.companyName}</p>
                            </div>
                         </Link>
                    )}


                     {!isAvatarExpanded && (
                         <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400"/>
                                <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
                            </div>
                            <Separator orientation="vertical" className="h-3" />
                            {isNewProvider ? (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">Nuevo</Badge>
                            ) : (
                                <>
                                    <span>{effectiveness.toFixed(0)}% Efec.</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span className="font-semibold text-green-600">{responseTime}</span>
                                </>
                            )}
                        </div>
                     )}
                </div>

                <div className="flex flex-col items-end">
                    <Button variant="ghost" size="sm" onClick={handleContact}>
                        Contactar
                    </Button>
                     {showLocationInfo && distance && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className={cn("h-3 w-3", owner.isGpsActive && "text-green-500")} />
                            <span>{distance}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Content */}
            <div 
                className="relative w-full group cursor-pointer" 
                onDoubleClick={() => setIsDetailsDialogOpen(true)}
            >
                <Image 
                    src={publication.src} 
                    alt={publication.alt} 
                    width={500}
                    height={500}
                    className={cn("w-full h-auto", 
                        publication.aspectRatio === 'horizontal' ? 'aspect-video' :
                        publication.aspectRatio === 'vertical' ? 'aspect-[4/5]' :
                        'aspect-square'
                    )}
                    style={{objectFit: 'cover'}}
                    data-ai-hint="service person working" 
                />
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 left-2 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <Flag className="w-4 h-4" />
                </Button>
                {isProduct && (
                     <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center text-white">
                        <div>
                            <p className="font-bold text-lg drop-shadow-md">${productDetails?.price.toFixed(2)}</p>
                        </div>
                        <Button onClick={handleAddToCart} disabled={!isWithinDeliveryRange} size="sm" className="bg-white/90 text-black hover:bg-white">
                            <Plus className="h-4 w-4 mr-1"/> Añadir al Carrito
                        </Button>
                    </div>
                )}
            </div>
            
             {/* Card Actions */}
             <div className="flex items-center p-2 container">
                 <Button variant="ghost" className="flex-1" onClick={handleLike}>
                    <Heart className={cn("w-5 h-5", isLiked && "text-red-500 fill-red-500")} />
                    <span className="ml-2 text-xs">{likeCount}</span>
                </Button>
                 <Button variant="ghost" className="flex-1" onClick={() => setIsDetailsDialogOpen(true)}>
                    <MessageCircle className="w-5 h-5"/>
                    <span className="ml-2 text-xs">{publication.comments?.length || 0}</span>
                </Button>
                 <Button variant="ghost" className="flex-1" onClick={handleShare}>
                    <Send className="w-5 h-5"/>
                    <span className="ml-2 text-xs">{shareCount}</span>
                </Button>
                 <Button variant="ghost" className="flex-1" onClick={handleSaveContact}>
                    <Bookmark className={cn("w-5 h-5", isSaved && "text-primary fill-primary")}/>
                </Button>
             </div>

             {/* Card Footer */}
             <div className="px-4 pb-4 container">
                 <p className="text-sm">
                    <Link href={profileLink} className="font-semibold hover:underline">{displayName}</Link>
                    <span className="text-muted-foreground ml-1">{publication.description}</span>
                 </p>
                 <p className="text-xs text-muted-foreground mt-2 uppercase cursor-pointer hover:underline" onClick={() => setIsDetailsDialogOpen(true)}>
                    Ver los {publication.comments?.length || 0} comentarios
                 </p>
             </div>
        </div>

        <ReportDialog 
            isOpen={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen} 
            providerId={owner.id} 
            publicationId={publication.id}
        />
        <ImageDetailsDialog
            isOpen={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            gallery={[publication]}
            owner={owner}
            startIndex={0}
        />
        </>
    );
}
