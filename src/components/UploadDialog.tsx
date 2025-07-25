
"use client";

import { useState, useRef, ChangeEvent } from 'react';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X } from 'lucide-react';
import type { GalleryImage } from '@/lib/types';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UploadDialog({ isOpen, onOpenChange }: UploadDialogProps) {
  const { currentUser, updateUserProfileAndGallery } = useCorabo();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setImagePreview(null);
    setDescription('');
    setFile(null);
    onOpenChange(false);
  };
  
  const handlePublish = () => {
    if (!file || !imagePreview || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor, selecciona una imagen y añade una descripción.",
      });
      return;
    }

    const newGalleryImage: GalleryImage = {
      src: imagePreview,
      alt: `Imagen de ${currentUser.name}`,
      description: description,
    };

    const updatedGallery = [newGalleryImage, ...(currentUser.gallery || [])];

    updateUserProfileAndGallery(currentUser.id, imagePreview, updatedGallery);

    toast({
      title: "¡Publicación Exitosa!",
      description: "Tu nueva imagen ya está en tu vitrina y tu perfil ha sido actualizado.",
    });

    handleClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Publicación</DialogTitle>
          <DialogDescription>
            Sube una imagen y compártela en tu vitrina.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Imagen</Label>
            <Input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {imagePreview ? (
              <div className="relative group w-full aspect-video rounded-md overflow-hidden">
                <Image src={imagePreview} alt="Vista previa" layout="fill" objectFit="cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setImagePreview(null);
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-full aspect-video border-2 border-dashed border-muted-foreground rounded-md flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={handleFileSelect}
              >
                <UploadCloud className="w-10 h-10 mb-2" />
                <p className="text-sm font-semibold">Haz clic para seleccionar una imagen</p>
                <p className="text-xs">PNG, JPG, etc.</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Añade una descripción para tu imagen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handlePublish} disabled={!imagePreview || !description.trim()}>
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    