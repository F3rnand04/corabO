

'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { UploadCloud, X, Image as ImageIcon, Video, PackagePlus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { CreatePublicationInput, CreateProductInput } from '@/lib/types';


interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UploadDialog({ isOpen, onOpenChange }: UploadDialogProps) {
  const { currentUser, createPublication, createProduct } = useCorabo();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!currentUser) return null;

  const canOfferProducts = currentUser.profileSetupData?.offerType === 'product';
  const isProvider = currentUser.type === 'provider';
  // If provider can only offer services, they shouldn't see the product option.
  const canOfferBoth = isProvider && canOfferProducts; 
  
  const getInitialView = () => {
      if (isProvider) {
          // If they can offer products, show selection. Otherwise go straight to gallery upload.
          return canOfferBoth ? 'selection' : 'upload_gallery';
      }
      return 'upload_gallery'; // Default for clients (emprende)
  }
  
  const [view, setView] = useState<'selection' | 'upload_gallery' | 'upload_product'>(getInitialView());
  
  // Reset view when dialog opens/user changes
  useEffect(() => {
    if (isOpen) {
        setView(getInitialView());
    }
  }, [isOpen, currentUser?.id]);


  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (fileInputRef.current) {
        if (type === 'gallery') {
            fileInputRef.current.setAttribute('accept', 'image/*,video/*');
        } else {
            fileInputRef.current.setAttribute('accept', 'image/*');
        }
        fileInputRef.current.click();
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
    setView(getInitialView());
    setGalleryImagePreview(null);
    setGalleryDescription('');
    setGalleryFile(null);
    setIsVideoFile(false);
    setProductImagePreview(null);
    setProductFile(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const handlePublishGallery = async () => {
    if (!galleryFile || !galleryImagePreview || !galleryDescription.trim() || !currentUser) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Debes subir un archivo y añadir una descripción." });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const publicationData: CreatePublicationInput = {
            userId: currentUser.id,
            description: galleryDescription,
            imageDataUri: galleryImagePreview,
            aspectRatio: galleryAspectRatio,
            type: isVideofile ? 'video' : 'image',
        };
        await createPublication(publicationData);
        toast({ title: "¡Publicación Exitosa!", description: "Tu nuevo contenido ya está en tu galería." });
        handleClose();
        router.refresh();
    } catch (error) {
        console.error("Error creating publication:", error);
        toast({ variant: "destructive", title: "Error al Publicar", description: "No se pudo crear la publicación." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePublishProduct = async () => {
    if (!productFile || !productImagePreview || !productName.trim() || !productDescription.trim() || !productPrice || !currentUser) {
        toast({ variant: "destructive", title: "Faltan datos", description: "Completa todos los campos del producto." });
        return;
    }

    setIsSubmitting(true);
    try {
        const productData: CreateProductInput = {
            userId: currentUser.id,
            name: productName,
            description: productDescription,
            price: parseFloat(productPrice),
            imageDataUri: productImagePreview,
        };
        await createProduct(productData);
        toast({ title: "¡Producto Añadido!", description: `${productName} ya está en tu catálogo.` });
        handleClose();
        router.push('/profile/catalog');
    } catch (error) {
        console.error("Error creating product:", error);
        toast({ variant: "destructive", title: "Error al Añadir Producto", description: "No se pudo crear el producto." });
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderSelectionView = () => (
    <>
      <DialogHeader>
        <DialogTitle>¿Qué quieres añadir?</DialogTitle>
        <DialogDescription>
          Elige si quieres subir una publicación a tu galería o añadir un producto a tu catálogo.
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
          <Button onClick={handlePublishGallery} disabled={!galleryImagePreview || !galleryDescription.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
            <Button onClick={handlePublishProduct} disabled={!productImagePreview || !productName.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Añadir Producto
            </Button>
        </DialogFooter>
     </>
  );

  const renderContent = () => {
    switch (view) {
        case 'selection':
            return renderSelectionView();
        case 'upload_gallery':
            return renderGalleryUploadView();
        case 'upload_product':
            return renderProductUploadView();
        default:
            return renderSelectionView(); // Fallback to selection
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
