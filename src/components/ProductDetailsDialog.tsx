
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
import { MessageSquare, ThumbsUp, ThumbsDown, Star, Send, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import type { Product, GalleryImageComment } from '@/lib/types';
import { useCorabo } from '@/contexts/CoraboContext';
import { useState } from 'react';

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
}

export function ProductDetailsDialog({ isOpen, onOpenChange, product }: ProductDetailsDialogProps) {
  const { currentUser, addToCart } = useCorabo();
  const [newComment, setNewComment] = useState("");
  // Comments would be fetched or part of product data
  const [comments, setComments] = useState<GalleryImageComment[]>([
    { author: "Ana P.", text: "¡Me encantó! Llegó súper rápido y es de buena calidad.", profileImage: `https://i.pravatar.cc/150?u=ana` },
    { author: "Carlos M.", text: "¿Tienen disponible en otro color?", profileImage: `https://i.pravatar.cc/150?u=carlos` },
  ]);

  if (!product) return null;

  const handlePostComment = () => {
    if (newComment.trim()) {
      const commentToAdd: GalleryImageComment = {
        author: currentUser.name,
        text: newComment,
        profileImage: currentUser.profileImage,
      };
      setComments(prev => [...prev, commentToAdd]);
      setNewComment("");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col max-h-[90vh]">
        <div className="relative aspect-video flex-shrink-0">
             <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint="product detail"
            />
             <div className="absolute bottom-2 right-2 flex items-end gap-2 text-white">
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10">
                        <Star className="w-5 h-5"/>
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">1.2k</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10">
                        <Send className="w-5 h-5"/>
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">345</span>
                </div>
             </div>
        </div>
        <ScrollArea className="flex-grow overflow-y-auto">
            <div className="p-6">
                <DialogHeader className="text-left mb-4">
                    <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                </DialogHeader>

                <p className="font-bold text-3xl mb-4">${product.price.toFixed(2)}</p>

                <p className="text-base text-foreground mb-6">
                    {product.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    <Button onClick={() => addToCart(product, 1)}>
                        <Plus className="mr-2 h-4 w-4"/>
                        Añadir al Carrito
                    </Button>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="ml-auto">Cerrar</Button>
                </div>

                <Separator />

                {/* Comments Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comentarios ({comments.length || 0})
                    </h3>
                    <div className="space-y-4">
                        {comments?.map((comment, index) => (
                           <div key={index} className="flex items-start gap-3">
                               <Avatar className="w-8 h-8 shrink-0">
                                   <AvatarImage src={comment.profileImage} alt={comment.author} />
                                   <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-grow">
                                   <p className="font-semibold text-sm">{comment.author}</p>
                                   <p className="text-sm text-muted-foreground">{comment.text}</p>
                                   <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                      <Button variant="ghost" size="icon" className="w-6 h-6">
                                          <ThumbsUp className="w-4 h-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-6 h-6">
                                          <ThumbsDown className="w-4 h-4"/>
                                      </Button>
                                   </div>
                               </div>
                           </div>
                        ))}
                         {!comments?.length && (
                             <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aún. ¡Sé el primero!</p>
                         )}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <Input 
                        placeholder="Añade un comentario..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <Button onClick={handlePostComment} disabled={!newComment.trim()}>Comentar</Button>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
