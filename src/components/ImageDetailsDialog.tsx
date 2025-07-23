
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
import { Trash2 } from 'lucide-react';

type GalleryImage = {
  src: string;
  alt: string;
  description: string;
};

interface ImageDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  image: GalleryImage | null;
}

export function ImageDetailsDialog({ isOpen, onOpenChange, image }: ImageDetailsDialogProps) {
  if (!image) return null;

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

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button variant="outline">Editar Descripción</Button>
                    <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="ml-auto">Cerrar</Button>
                </div>

                <DialogDescription className="text-base text-foreground">
                    {image.description}
                </DialogDescription>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
