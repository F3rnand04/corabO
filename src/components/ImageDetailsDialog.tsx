
"use client";

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from './ui/scroll-area';
import { Trash2, MessageSquare, ThumbsUp, ThumbsDown, X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import type { GalleryImage, GalleryImageComment, User } from '@/lib/types';
import { useCorabo } from '@/contexts/CoraboContext';
import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';


interface ImageDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gallery: GalleryImage[];
  startIndex?: number;
  owner?: User;
}

export function ImageDetailsDialog({ isOpen, onOpenChange, gallery, startIndex = 0, owner }: ImageDetailsDialogProps) {
  const { currentUser, updateUserProfileAndGallery, addCommentToImage, removeCommentFromImage } = useCorabo();
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(startIndex);
  const [newComment, setNewComment] = useState("");

  const isOwnerView = currentUser.id === owner?.id;
  const currentImage = gallery[currentImageIndex];

  useEffect(() => {
    if (!api) return;
    
    api.on("select", () => {
      setCurrentImageIndex(api.selectedScrollSnap());
    });
    
    // Go to initial slide
    if(api.selectedScrollSnap() !== startIndex) {
        api.scrollTo(startIndex, true);
    }

  }, [api, startIndex]);
  
  const handlePostComment = () => {
    if (newComment.trim() && currentImage && owner) {
        addCommentToImage(owner.id, currentImage.id, newComment);
        setNewComment("");
    }
  }
  
  const handleDeleteComment = (commentIndex: number) => {
    if (currentImage && owner) {
        removeCommentFromImage(owner.id, currentImage.id, commentIndex);
    }
  }

  const handleDeletePublication = (imageId: string) => {
    if (owner) {
      updateUserProfileAndGallery(owner.id, imageId, true);
      onOpenChange(false);
    }
  }


  if (!gallery || gallery.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader>
            <DialogTitle className="sr-only">{currentImage.alt}</DialogTitle>
        </DialogHeader>
         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="absolute top-2 right-2 z-50 bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full">
            <X className="h-5 w-5"/>
         </Button>

        <div className="w-full h-3/5 bg-black flex-shrink-0 relative">
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent>
                    {gallery.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="w-full h-full relative">
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-contain"
                            data-ai-hint="product detail"
                        />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
        </div>

        <ScrollArea className="flex-grow overflow-y-auto bg-background">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">{currentImage.alt}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Publicado por <span className="font-semibold text-foreground">{owner?.name}</span>
                        </p>
                    </div>
                    {isOwnerView && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeletePublication(currentImage.id)}>
                            <Trash2 className="h-4 w-4 mr-2"/>
                            Eliminar Publicación
                        </Button>
                    )}
                </div>
                
                <p className="text-sm text-foreground my-4">{currentImage.description}</p>
                
                <Separator />

                {/* Comments Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comentarios ({currentImage.comments?.length || 0})
                    </h3>
                    <div className="space-y-4">
                        {currentImage.comments?.map((comment, index) => (
                           <div key={index} className="flex items-start gap-3 group">
                               <Avatar className="w-8 h-8 shrink-0">
                                   <AvatarImage src={comment.profileImage} alt={comment.author} />
                                   <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-grow">
                                   <p className="font-semibold text-sm">{comment.author}</p>
                                   <p className="text-sm text-muted-foreground">{comment.text}</p>
                                   <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                      <Button variant="ghost" size="icon" className="w-6 h-6"><ThumbsUp className="w-4 h-4"/></Button>
                                      <span className="text-xs">{comment.likes || 0}</span>
                                      <Button variant="ghost" size="icon" className="w-6 h-6"><ThumbsDown className="w-4 h-4"/></Button>
                                      <span className="text-xs">{comment.dislikes || 0}</span>
                                   </div>
                               </div>
                                {comment.author === currentUser.name && (
                                   <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(index)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                   </Button>
                                )}
                           </div>
                        ))}
                         {!currentImage.comments?.length && (
                             <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aún. ¡Sé el primero!</p>
                         )}
                    </div>
                     <div className="mt-6 flex items-center gap-2">
                        <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={currentUser.profileImage} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Input 
                        placeholder="Añade un comentario..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <Button onClick={handlePostComment} disabled={!newComment.trim()} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
