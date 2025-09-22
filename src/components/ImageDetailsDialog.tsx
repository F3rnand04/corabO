'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from './ui/scroll-area';
import { Trash2, MessageSquare, ThumbsUp, ThumbsDown, X, Send, Edit, ImageUp, Check } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import type { GalleryImage, GalleryImageComment, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { addCommentToImage, removeCommentFromImage, removeGalleryImage, updateGalleryImage } from '@/lib/actions';


interface ImageDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gallery: GalleryImage[];
  startIndex?: number;
  owner?: User;
}

export function ImageDetailsDialog({ isOpen, onOpenChange, gallery, startIndex = 0, owner }: ImageDetailsDialogProps) {
  const { currentUser } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(startIndex);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const isOwnerView = currentUser?.id === owner?.id;
  
  const currentImage = gallery[currentImageIndex];

  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(startIndex); // Reset index when dialog closes
      setIsEditing(false); // Reset editing state
    } else {
      setEditedDescription(currentImage?.description || '');
      setNewImagePreview(null);
      setNewImageFile(null);
    }
  }, [isOpen, startIndex, currentImage]);

  useEffect(() => {
    if (!api) return;
    
    // Synchronize the carousel with the current image index state
    if(api.selectedScrollSnap() !== currentImageIndex) {
        api.scrollTo(currentImageIndex, true);
    }

    const onSelect = () => {
      setCurrentImageIndex(api.selectedScrollSnap());
      setIsEditing(false); // Exit edit mode when sliding to another image
    };
    
    api.on("select", onSelect);
    
    return () => {
      api.off("select", onSelect);
    };

  }, [api, currentImageIndex]);

  
  const handlePostComment = () => {
    if (newComment.trim() && currentImage && owner && currentUser) {
        addCommentToImage({
            ownerId: owner.id,
            imageId: currentImage.id,
            commentText: newComment,
            author: {
                id: currentUser.id,
                name: currentUser.name,
                profileImage: currentUser.profileImage
            }
        });
        setNewComment("");
    }
  }
  
  const handleDeleteComment = (commentIndex: number) => {
    if (currentImage && owner && currentUser) {
        removeCommentFromImage({
            ownerId: owner.id,
            imageId: currentImage.id,
            commentIndex,
            authorId: currentUser.id,
        });
    }
  }

  const handleDeletePublication = (imageId: string) => {
    if (owner && currentUser) {
      removeGalleryImage(owner.id, imageId);
      onOpenChange(false);
    }
  }

  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    if (!currentImage || !owner) return;
    
    updateGalleryImage(currentImage.id, {
        description: editedDescription,
        imageDataUri: newImagePreview || undefined, // Send undefined if not changed
    });
    setIsEditing(false);
  };


  if (!gallery || gallery.length === 0 || !currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader>
            <DialogTitle className="sr-only">{currentImage?.alt}</DialogTitle>
        </DialogHeader>
         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="absolute top-2 right-2 z-50 bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full">
            <X className="h-5 w-5"/>
         </Button>

        <div className="w-full h-3/5 bg-black flex-shrink-0 relative">
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent>
                    {gallery.map((media, index) => (
                    <CarouselItem key={index}>
                        <div className="w-full h-full relative">
                          {media.type === 'video' ? (
                              <video src={media.src} className="w-full h-full object-contain" controls autoPlay loop />
                          ) : (
                              <Image
                                  src={newImagePreview || media.src}
                                  alt={media.alt}
                                  fill
                                  className="object-contain"
                                  data-ai-hint="product detail"
                              />
                          )}
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
        </div>

        <ScrollArea className="flex-grow overflow-y-auto bg-background">
           {currentImage && (
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">{currentImage.alt}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Publicado por <span className="font-semibold text-foreground">{owner?.name}</span>
                        </p>
                    </div>
                    {isOwnerView && !isEditing && (
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4 mr-2"/>
                                Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePublication(currentImage.id)}>
                                <Trash2 className="h-4 w-4 mr-2"/>
                                Eliminar
                            </Button>
                        </div>
                    )}
                </div>
                
                {isEditing ? (
                    <div className='my-4 space-y-4'>
                         <input type="file" ref={fileInputRef} onChange={handleEditFileChange} className="hidden" accept="image/*,video/*" />
                         <Button variant="outline" className='w-full' onClick={() => fileInputRef.current?.click()}>
                            <ImageUp className="mr-2 h-4 w-4"/>
                            Cambiar Imagen o Video
                         </Button>
                         <Textarea 
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            rows={4}
                            placeholder="Edita la descripción..."
                         />
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSaveChanges}><Check className="mr-2 h-4 w-4"/>Guardar Cambios</Button>
                         </div>
                    </div>
                ) : (
                    <p className="text-sm text-foreground my-4">{currentImage.description}</p>
                )}
                
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
                                      <span className="text-xs">{0}</span>
                                      <Button variant="ghost" size="icon" className="w-6 h-6"><ThumbsDown className="w-4 h-4"/></Button>
                                      <span className="text-xs">{0}</span>
                                   </div>
                               </div>
                                {(comment.authorId === currentUser.id || isOwnerView) && (
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
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
