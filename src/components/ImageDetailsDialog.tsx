
"use client";

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from './ui/scroll-area';
import { Trash2, MessageSquare } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import type { GalleryImage } from '@/lib/types';
import { useCorabo } from '@/contexts/CoraboContext';

type Comment = {
  author: string;
  text: string;
};

interface ImageDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  image: GalleryImage | null;
  isOwnerView?: boolean;
  onDelete?: (imageId: string) => void;
}

export function ImageDetailsDialog({ isOpen, onOpenChange, image, isOwnerView = false, onDelete }: ImageDetailsDialogProps) {
  const { currentUser } = useCorabo();

  if (!image) return null;

  const handleDelete = () => {
    if(onDelete && image) {
      onDelete(image.id);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col max-h-[90vh]">
        <div className="relative aspect-video flex-shrink-0">
             <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint="product detail"
            />
        </div>
        <ScrollArea className="flex-grow overflow-y-auto">
            <div className="p-6">
                <DialogHeader className="text-left mb-4">
                    <DialogTitle className="text-2xl">{image.alt}</DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-base text-foreground mb-6">
                    {image.description}
                </DialogDescription>

                <div className="flex flex-wrap gap-2 mb-6">
                    {isOwnerView && (
                      <>
                        <Button variant="outline">Editar Descripción</Button>
                        <Button variant="destructive" size="icon" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="ml-auto">Cerrar</Button>
                </div>

                <Separator />

                {/* Comments Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comentarios ({image.comments?.length || 0})
                    </h3>
                    <div className="space-y-4">
                        {image.comments?.map((comment, index) => (
                           <div key={index} className="flex items-start gap-3">
                               <Avatar className="w-8 h-8 shrink-0">
                                   <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold text-sm">{comment.author}</p>
                                   <p className="text-sm text-muted-foreground">{comment.text}</p>
                               </div>
                           </div>
                        ))}
                         {!image.comments?.length && (
                             <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aún. ¡Sé el primero!</p>
                         )}
                    </div>
                     {!isOwnerView && (
                          <div className="mt-6 flex items-center gap-2">
                              <Input placeholder="Añade un comentario..." />
                              <Button>Comentar</Button>
                          </div>
                      )}
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
