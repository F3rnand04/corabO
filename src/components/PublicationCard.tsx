

"use client";

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


interface PublicationCardProps {
    publication: GalleryImage & { owner?: PublicationOwner }; // owner is optional for safety
    className?: string;
}

export function PublicationCard({ publication, className }: PublicationCardProps) {
    const { addContact, isContact, sendMessage, currentUser, getUserMetrics, transactions, addToCart, getDistanceToProvider, updateCartQuantity } = useCorabo();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [shareCount, setShareCount] = useState(0);

    const { owner } = publication;
    
    if (!owner || !owner.id) {
        return null; 
    }
    
    const isProduct = publication.type === 'product';
    const productDetails = publication.productDetails;
    const activeCartTx = transactions.find(tx => tx.status === 'Carrito Activo' && tx.providerId === publication.providerId);
    const cartItem = activeCartTx?.details.items?.find(item => item.product.id === publication.id);
    const quantityInCart = cartItem?.quantity || 0;

    const isWithinDeliveryRange = true; 

    const profileLink = `/companies/${owner.id}`;
    const { reputation, effectiveness, responseTime } = getUserMetrics(owner.id, transactions);
    const isNewProvider = responseTime === 'Nuevo';
    const distance = getDistanceToProvider(owner as User);


    useEffect(() => {
        if (!currentUser || !owner) return;
        setIsSaved(isContact(owner.id));
        setLikeCount(publication.likes || 0);
        setShareCount(0);
    }, [isContact, owner.id, publication, currentUser, owner]);

    const handleSaveContact = () => {
        const success = addContact(owner as User);
        if (success) {
            toast({
                title: "¡Contacto Guardado!",
                description: `Has añadido a ${owner.name} a tus contactos.`
            });
            setIsSaved(true);
        } else {
            toast({
                title: "Contacto ya existe",
                description: `${owner.name} ya está en tu lista de contactos.`
            });
        }
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
        if (!isProduct || !productDetails) return;
        if (!currentUser?.isTransactionsActive) {
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
        addToCart({
            id: publication.id,
            name: productDetails.name,
            description: publication.description,
            price: productDetails.price,
            category: productDetails.category,
            providerId: publication.providerId,
            imageUrl: publication.src,
        }, 1);
    };

    const displayName = owner.profileSetupData?.username || owner.name || 'Usuario Corabo';
    const specialty = owner.profileSetupData?.specialty || "Especialidad no definida";
    
    return (
        <>
        <div className={cn("flex flex-col rounded-2xl overflow-hidden shadow-lg border bg-card", className)}>
            {/* Card Header */}
            <div className="flex items-start p-3 gap-3">
                <Link href={profileLink} className="flex-shrink-0">
                    <Avatar>
                        <AvatarImage src={owner.profileImage} alt={owner.name} />
                        <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-grow">
                    <Link href={profileLink} className="font-semibold text-sm hover:underline flex items-center gap-1.5">
                        {displayName}
                        {owner.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    </Link>
                    <p className="text-xs text-muted-foreground">{specialty}</p>
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
                </div>
                <div className="flex flex-col items-end">
                    <Button variant="ghost" size="sm" onClick={() => sendMessage(owner.id, `¡Hola! Me interesa tu publicación.`, true)}>
                        Contactar
                    </Button>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className={cn("h-3 w-3", owner.isGpsActive && "text-green-500")} />
                        <span>{distance}</span>
                    </div>
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
                    objectFit="cover"
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
             <div className="flex items-center p-2">
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
             <div className="px-4 pb-4">
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
            owner={owner as User}
            startIndex={0}
        />
        </>
    );
}
