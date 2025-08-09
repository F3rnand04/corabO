

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
import { UploadCloud, X, Image as ImageIcon, Video, PackagePlus } from 'lucide-react';
import type { GalleryImage, Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UploadDialog({ isOpen, onOpenChange }: UploadDialogProps) {
  const { currentUser, updateUserProfileAndGallery, addProduct } = useCorabo();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine view based on provider type, default to 'upload_gallery' if not product provider
  const isProductProvider = currentUser.profileSetupData?.offerType === 'product';
  const [view, setView] = useState<'selection' | 'upload_gallery' | 'upload_product'>(isProductProvider ? 'selection' : 'upload_gallery');
  
  // Gallery state
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [isVideofile, setIsVideoFile] = useState(false);
  const [galleryAspectRatio, setGalleryAspectRatio] = useState<'square' | 'horizontal' | 'vertical'>('square');

  // Product state
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const handleFileSelect = (type: 'gallery' | 'product') => {
    fileInputRef.current?.click();
    if(type === 'gallery') {
        fileInputRef.current?.setAttribute('accept', 'image/*,video/*');
    } else {
        fileInputRef.current?.setAttribute('accept', 'image/*');
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (view === 'upload_gallery') {
                setGalleryFile(selectedFile);
                setGalleryImagePreview(result);
                const isVideo = selectedFile.type.startsWith('video/');
                setIsVideoFile(isVideo);

                if (isVideo) {
                    setGalleryAspectRatio('horizontal');
                } else {
                    const img = new window.Image();
                    img.src = result;
                    img.onload = () => {
                        const ratio = img.width / img.height;
                        if (ratio > 1.2) setGalleryAspectRatio('horizontal');
                        else if (ratio < 0.9) setGalleryAspectRatio('vertical');
                        else setGalleryAspectRatio('square');
                    };
                }

            } else if (view === 'upload_product') {
                setProductFile(selectedFile);
                setProductImagePreview(result);
            }
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  const resetState = () => {
    setView(isProductProvider ? 'selection' : 'upload_gallery');
    setGalleryImagePreview(null);
    setGalleryDescription('');
    setGalleryFile(null);
    setIsVideoFile(false);
    setProductImagePreview(null);
    setProductFile(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const handlePublishGallery = () => {
    if (!galleryFile || !galleryImagePreview || !galleryDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor, selecciona un archivo y añade una descripción.",
      });
      return;
    }

    const newGalleryItem: GalleryImage = {
      id: `gal-${Date.now()}`,
      providerId: currentUser.id,
      type: isVideofile ? 'video' : 'image',
      src: galleryImagePreview,
      alt: `Publicación de ${currentUser.name}`,
      description: galleryDescription,
      comments: [],
      createdAt: new Date().toISOString(),
      aspectRatio: galleryAspectRatio,
    };

    updateUserProfileAndGallery(currentUser.id, newGalleryItem);

    toast({
      title: "¡Publicación Exitosa!",
      description: "Tu nuevo contenido ya está en tu galería.",
    });

    handleClose();
  };

  const handlePublishProduct = () => {
    if (!productFile || !productImagePreview || !productName.trim() || !productDescription.trim() || !productPrice) {
        toast({ variant: "destructive", title: "Faltan datos", description: "Completa todos los campos del producto." });
        return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productName,
      description: productDescription,
      price: parseFloat(productPrice),
      category: currentUser.profileSetupData?.primaryCategory || 'General',
      providerId: currentUser.id,
      imageUrl: productImagePreview,
    };
    addProduct(newProduct);
    toast({ title: "¡Producto Añadido!", description: `${productName} ya está en tu catálogo.` });
    handleClose();
  }
  
  const renderSelectionView = () => (
    <>
      <DialogHeader>
        <DialogTitle>¿Qué quieres añadir?</DialogTitle>
        <DialogDescription>
          Elige si quieres subir una publicación a tu galería o añadir un nuevo producto a tu catálogo.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-4">
        <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => setView('upload_gallery')}>
          <ImageIcon className="w-8 h-8" />
          Publicar en Galería
        </Button>
        <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => setView('upload_product')}>
          <PackagePlus className="w-8 h-8" />
          Añadir Producto
        </Button>
      </div>
    </>
  );

  const renderGalleryUploadView = () => (
     <>
        <DialogHeader>
          <DialogTitle>Crear Nueva Publicación</DialogTitle>
          <DialogDescription>
            Sube una imagen o video y compártelo en tu vitrina para atraer clientes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Archivo (Imagen o Video)</Label>
            <Input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*"
            />
            {galleryImagePreview ? (
              <div className="relative group w-full aspect-video rounded-md overflow-hidden bg-black">
                {isVideofile ? (
                    <video src={galleryImagePreview} className="w-full h-full object-contain" controls />
                ) : (
                    <Image src={galleryImagePreview} alt="Vista previa" layout="fill" objectFit="contain" />
                )}
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setGalleryImagePreview(null); setGalleryFile(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-full aspect-video border-2 border-dashed border-muted-foreground rounded-md flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleFileSelect('gallery')}
              >
                <UploadCloud className="w-10 h-10 mb-2" />
                <p className="text-sm font-semibold">Haz clic para seleccionar un archivo</p>
                <p className="text-xs">PNG, JPG, MP4, etc.</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Añade una descripción para tu publicación..."
              value={galleryDescription}
              onChange={(e) => setGalleryDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handlePublishGallery} disabled={!galleryImagePreview || !galleryDescription.trim()}>
            Publicar en Galería
          </Button>
        </DialogFooter>
     </>
  );

  const renderProductUploadView = () => (
     <>
        <DialogHeader>
            <DialogTitle>Añadir Nuevo Producto</DialogTitle>
            <DialogDescription>Completa los datos para añadir un producto a tu catálogo de venta.</DialogDescription>
        </DialogHeader>
         <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
             <Alert>
                <AlertTitle className='text-sm'>Sugerencia de Imagen</AlertTitle>
                <AlertDescription className='text-xs'>Para una mejor visualización, te sugerimos usar imágenes con fondo blanco.</AlertDescription>
            </Alert>
             <div className="space-y-2">
                <Label>Imagen del Producto</Label>
                 <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 {productImagePreview ? (
                    <div className="relative group w-full aspect-square rounded-md overflow-hidden">
                        <Image src={productImagePreview} alt="Vista previa" layout="fill" objectFit="cover" />
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setProductImagePreview(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="w-full aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer" onClick={() => handleFileSelect('product')}>
                        <UploadCloud className="w-10 h-10 text-muted-foreground" />
                    </div>
                )}
             </div>
             <div className="space-y-2">
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="product-desc">Descripción</Label>
                <Textarea id="product-desc" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="product-price">Precio (USD)</Label>
                <Input id="product-price" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
             </div>
         </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handlePublishProduct} disabled={!productImagePreview || !productName.trim()}>Añadir Producto</Button>
        </DialogFooter>
     </>
  );

  const renderContent = () => {
    if (view === 'upload_gallery') {
        return renderGalleryUploadView();
    }
    if (view === 'upload_product') {
        return renderProductUploadView();
    }
    return renderSelectionView();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
