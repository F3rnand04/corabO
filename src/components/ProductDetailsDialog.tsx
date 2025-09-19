
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
import { MessageSquare, ThumbsUp, ThumbsDown, Heart, Send, Plus, Minus, X, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import type { Product, GalleryImageComment, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { updateCart } from '@/lib/actions/cart.actions';
import { removeGalleryImage } from '@/lib/actions/publication.actions';


interface ProductDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
}

export function ProductDetailsDialog({ isOpen, onOpenChange, product }: ProductDetailsDialogProps) {
  const { currentUser, cart } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  // Comments are now managed locally for this dialog
  const [comments, setComments] = useState<GalleryImageComment[]>([]);

  const [commentVotes, setCommentVotes] = useState<Record<number, 'like' | 'dislike' | null>>({});

  useEffect(() => {
    // Reset votes when product changes
    setCommentVotes({});
    setComments([]); // Also reset comments
  }, [product]);

  if (!currentUser || !product) return null;

  const isOwner = currentUser.id === product.providerId;

  const itemInCart = cart.find(item => item.product.id === product.id);
  const quantityInCart = itemInCart ? itemInCart.quantity : 0;
  const isTransactionReady = currentUser.isTransactionsActive;

  const handleAddToCart = () => {
      if (!isTransactionReady) {
          toast({
              variant: "destructive",
              title: "Acción Requerida",
              description: "Por favor, activa tu registro de transacciones para poder añadir productos al carrito.",
          });
          return;
      }
      updateCart(currentUser.id, product.id, (quantityInCart || 0) + 1);
  }

  const handleUpdateQuantity = (newQuantity: number) => {
      if (!isTransactionReady) {
           toast({
              variant: "destructive",
              title: "Acción Requerida",
              description: "Tu registro de transacciones debe estar activo.",
          });
          return;
      }
      updateCart(currentUser.id, product.id, newQuantity);
  }

  const handlePostComment = () => {
    if (newComment.trim()) {
      const commentToAdd: GalleryImageComment = {
        authorId: currentUser.id,
        author: currentUser.name,
        text: newComment,
        profileImage: currentUser.profileImage,
        likes: 0,
        dislikes: 0,
      };
      setComments(prev => [...prev, commentToAdd]);
      setNewComment("");
    }
  }

  const handleVote = (index: number, voteType: 'like' | 'dislike') => {
    const currentVote = commentVotes[index];
    const newComments = [...comments];
    const comment = newComments[index];

    // Annul previous vote if any
    if (currentVote === 'like') comment.likes = 0;
    if (currentVote === 'dislike') comment.dislikes = 0;

    // Apply new vote
    if (currentVote === voteType) { // User is annulling their vote
      setCommentVotes(prev => ({ ...prev, [index]: null }));
    } else { // User is casting a new vote
      if (voteType === 'like') comment.likes = 1;
      if (voteType === 'dislike') comment.dislikes = 1;
      setCommentVotes(prev => ({ ...prev, [index]: voteType }));
    }

    setComments(newComments);
  };

  const handleDeleteProduct = () => {
    removeGalleryImage(product.providerId, product.id);
    onOpenChange(false);
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
                        <Heart className="w-5 h-5"/>
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">0</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-10 w-10">
                        <Send className="w-5 h-5"/>
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">0</span>
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
                    {quantityInCart === 0 ? (
                         <Button onClick={handleAddToCart} disabled={!isTransactionReady}>
                            <Plus className="mr-2 h-4 w-4"/>
                            Añadir al Carrito
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                           <Button variant="outline" size="icon" onClick={() => handleUpdateQuantity(quantityInCart - 1)} disabled={!isTransactionReady}>
                                <Minus className="h-4 w-4" />
                           </Button>
                           <span className="font-bold text-lg w-10 text-center">{quantityInCart}</span>
                           <Button variant="outline" size="icon" onClick={() => handleUpdateQuantity(quantityInCart + 1)} disabled={!isTransactionReady}>
                                <Plus className="h-4 w-4" />
                           </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleUpdateQuantity(0)} disabled={!isTransactionReady}>
                                <X className="h-5 w-5" />
                           </Button>
                        </div>
                    )}
                    {isOwner ? (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" className="ml-auto">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Eliminar Producto
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción es permanente y no se puede deshacer. El producto se eliminará de tu catálogo y de cualquier carrito en el que se encuentre.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteProduct}>Sí, eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                       <Button variant="secondary" onClick={() => onOpenChange(false)} className="ml-auto">Cerrar</Button>
                    )}
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
                                   <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleVote(index, 'like')}>
                                          <ThumbsUp className={`w-4 h-4 ${commentVotes[index] === 'like' ? 'text-primary fill-primary' : ''}`}/>
                                      </Button>
                                       <span className="text-xs min-w-[1ch]">{0}</span>
                                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleVote(index, 'dislike')}>
                                          <ThumbsDown className={`w-4 h-4 ${commentVotes[index] === 'dislike' ? 'text-destructive fill-destructive' : ''}`}/>
                                      </Button>
                                       <span className="text-xs min-w-[1ch]">{0}</span>
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
