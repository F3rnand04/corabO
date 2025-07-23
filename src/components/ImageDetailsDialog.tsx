
"use client";

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="sm:max-w-3xl p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto">
                 <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                    data-ai-hint="product detail"
                />
            </div>
            <div className="flex flex-col">
                <DialogHeader className="p-6 pb-2 text-left">
                    <DialogTitle className="text-2xl">{image.alt}</DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-0 flex-grow overflow-y-auto">
                    <DialogDescription className="text-base text-foreground">
                        {image.description}
                    </DialogDescription>
                </div>
                <DialogFooter className="p-6 pt-2 bg-muted/50 rounded-b-lg md:rounded-b-none md:rounded-br-lg flex-row justify-between sm:justify-between">
                     <Button variant="ghost">Editar Descripción</Button>
                     <Button variant="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
