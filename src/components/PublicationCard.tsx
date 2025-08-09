"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { User as UserType, GalleryImage } from "@/lib/types";
import { Star, Bookmark, Send, MessageCircle, Flag } from "lucide-react";
import Link from "next/link";
import { useCorabo } from "@/contexts/CoraboContext";
import { useState, useEffect } from "react";
import { ReportDialog } from "./ReportDialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageDetailsDialog } from "./ImageDetailsDialog";
import { useToast } from "@/hooks/use-toast";

interface PublicationCardProps {
    publication: GalleryImage;
    owner: UserType;
    className?: string;
}

export function PublicationCard({ publication, owner, className }: PublicationCardProps) {
    const { addContact, isContact, sendMessage } = useCorabo();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [shareCount, setShareCount] = useState(0);

    const profileLink = `/companies/${owner.id}`;

    useEffect(() => {
        setIsSaved(isContact(owner.id));
        setLikeCount(Math.floor(Math.random() * 20));
        setShareCount(Math.floor(Math.random() * 10));
    }, [isContact, owner.id]);

    const handleSaveContact = () => {
        const success = addContact(owner);
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
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
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

    if (!publication) return null;

    return (
        <>
        <div 
            className={cn("relative w-full group cursor-pointer", 
                publication.aspectRatio === 'horizontal' ? 'aspect-video' :
                publication.aspectRatio === 'vertical' ? 'aspect-[4/5]' :
                'aspect-square',
                className
            )} 
            onDoubleClick={() => setIsDetailsDialogOpen(true)}
        >
            <Image 
                src={publication.src} 
                alt={publication.alt} 
                layout="fill" 
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
            
            <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10" onClick={handleLike}>
                        <Star className={cn("w-5 h-5", isLiked && "fill-yellow-400 text-yellow-400")} />
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">{likeCount}</span>
                </div>
                <div className="flex flex-col items-center">
                     <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10" onClick={() => setIsDetailsDialogOpen(true)}>
                        <MessageCircle className="w-5 h-5" />
                     </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">{publication.comments?.length || 0}</span>
                </div>
                 <div className="flex flex-col items-center">
                     <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10" onClick={handleShare}>
                        <Send className="w-5 h-5" />
                     </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">{shareCount}</span>
                </div>
                <div className="flex flex-col items-center">
                     <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10" onClick={handleSaveContact}>
                        <Bookmark className={cn("w-5 h-5", isSaved && "fill-primary text-primary")} />
                     </Button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
                <Link href={profileLink} className="font-bold drop-shadow hover:underline">@{owner.profileSetupData?.username || owner.name}</Link>
                <p className="text-sm drop-shadow-sm line-clamp-2 mt-1">{publication.description}</p>
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
