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
import { useAuth } from "@/hooks/use-auth-provider";
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X, Image as ImageIcon, Video, PackagePlus, Loader2, Crop, RotateCw, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { CreatePublicationInput, CreateProductInput } from '@/lib/types';
import { createProduct, createPublication } from '@/lib/actions';

function ImageEditor({ src, onConfirm, onCancel, isVideo }: { src: string, onConfirm: (dataUrl: string, aspectRatio: 'square' | 'horizontal' | 'vertical') => void, onCancel: () => void, isVideo: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [aspectRatio, setAspectRatio] = useState<'square' | 'horizontal' | 'vertical'>('square');

    useEffect(() => {
        if (isVideo || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
            let sx=0, sy=0, sWidth=img.width, sHeight=img.height;
            let targetWidth, targetHeight;
            
            if(aspectRatio === 'square') {
                sWidth = sHeight = Math.min(img.width, img.height);
                targetWidth = targetHeight = 800;
            } else if (aspectRatio === 'horizontal') {
                sHeight = img.width / (16/9);
                if (sHeight > img.height) {
                    sHeight = img.height;
                    sWidth = sHeight * (16/9);
                }
                targetWidth = 800;
                targetHeight = 450;
            } else { // vertical
                sWidth = img.height * (4/5);
                 if (sWidth > img.width) {
                    sWidth = img.width;
                    sHeight = sWidth * (5/4);
                }
                targetWidth = 640;
                targetHeight = 800;
            }

            sx = Math.max(0, (img.width - sWidth) / 2);
            sy = Math.max(0, (img.height - sHeight) / 2);

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        }
    }, [src, aspectRatio, isVideo]);
    
    const handleConfirm = () => {
        if(isVideo) {
          onConfirm(src, 'horizontal'); // Videos default to horizontal
          return;
        }
        if(!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
        onConfirm(dataUrl, aspectRatio);
    }

    return (
        <div className="space-y-4">
             <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center">
                {isVideo ? (
                    <video src={src} controls className="max-h-full" />
                ) : (
                    <canvas ref={canvasRef} className="max-w-full max-h-full" />
                )}
            </div>
            {!isVideo && (
                 <div className="flex justify-center gap-2">
                    <Button variant={aspectRatio === 'square' ? 'default' : 'outline'} onClick={() => setAspectRatio('square')}>Cuadrado (1:1)</Button>
                    <Button variant={aspectRatio === 'horizontal' ? 'default' : 'outline'} onClick={() => setAspectRatio('horizontal')}>Horizontal (16:9)</Button>
                    <Button variant={aspectRatio === 'vertical' ? 'default' : 'outline'} onClick={() => setAspectRatio('vertical')}>Vertical (4:5)</Button>
                </div>
            )}
             <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleConfirm}><Check className="mr-2 h-4 w-4"/>Confirmar</Button>
            </div>
        </div>
    )
}


interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UploadDialog({ isOpen, onOpenChange }: UploadDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [currentView, setCurrentView] = useState<'selection' | 'upload_gallery' | 'upload_product' | 'edit'>('selection');

  useEffect(() => {
    if (isOpen && currentUser) {
        const canOfferProducts = currentUser.profileSetupData?.offerType === 'product' || currentUser.profileSetupData?.offerType === 'both';
        const canOfferServices = currentUser.profileSetupData?.offerType === 'service' || currentUser.profileSetupData?.offerType === 'both';

        if (canOfferProducts && canOfferServices) setCurrentView('selection');
        else if (canOfferProducts) setCurrentView('upload_product');
        else setCurrentView('upload_gallery');
    }
  }, [isOpen, currentUser]);


  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFileSrc, setEditingFileSrc] = useState<string | null>(null);

  // Gallery state
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const [galleryDescription, setGalleryDescription] = useState('');
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [galleryAspectRatio, setGalleryAspectRatio] = useState<'square' | 'horizontal' | 'vertical'>('square');

  // Product state
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const handleFileSelect = (type: 'gallery' | 'product') => {
    if (fileInputRef.current) {
        fileInputRef.current.setAttribute('accept', type === 'gallery' ? 'image/*,video/*' : 'image/*');
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setEditingFileSrc(result);
            setIsVideoFile(selectedFile.type.startsWith('video/'));
            setCurrentView('edit');
        };
        reader.readAsDataURL(selectedFile);
    }
  };
  
   const handleEditConfirm = (dataUrl: string, aspectRatio: 'square' | 'horizontal' | 'vertical') => {
        if(currentView === 'upload_gallery' || (currentView === 'edit' && !productName)) { // logic to know if we are editing for gallery
            setGalleryImagePreview(dataUrl);
            setGalleryAspectRatio(aspectRatio);
            setCurrentView('upload_gallery');
        } else {
            setProductImagePreview(dataUrl);
            setCurrentView('upload_product');
        }
        setEditingFileSrc(null);
    }

    const handleEditCancel = () => {
        // Return to the view that triggered the editor
        if(editingFileSrc && !galleryImagePreview && !productImagePreview){
            setCurrentView('selection');
        } else if (productName) {
            setCurrentView('upload_product');
        } else {
            setCurrentView('upload_gallery');
        }
        setEditingFileSrc(null);
    }


  const resetState = () => {
    setCurrentView('selection');
    setGalleryImagePreview(null);
    setGalleryDescription('');
    setIsVideoFile(false);
    setProductImagePreview(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setIsSubmitting(false);
    setEditingFileSrc(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const handlePublishGallery = async () => {
    if (!galleryImagePreview || !galleryDescription.trim() || !currentUser) {
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
            type: isVideoFile ? 'video' : 'image',
        };
        await createPublication(publicationData);
        toast({ title: "¡Publicación Exitosa!", description: "Tu nuevo contenido ya está en tu galería." });
        handleClose();
    } catch (error) {
        console.error("Error creating publication:", error);
        toast({ variant: "destructive", title: "Error al Publicar", description: "No se pudo crear la publicación." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePublishProduct = async () => {
    if (!productImagePreview || !productName.trim() || !productDescription.trim() || !productPrice || !currentUser) {
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
  
  const renderView = () => {
      if(editingFileSrc){
          return (
             <>
                 <DialogHeader>
                    <DialogTitle>Editar Archivo</DialogTitle>
                    <DialogDescription>Ajusta tu imagen o video antes de publicar.</DialogDescription>
                 </DialogHeader>
                <ImageEditor src={editingFileSrc} onConfirm={handleEditConfirm} onCancel={handleEditCancel} isVideo={isVideoFile}/>
             </>
          )
      }
      
      switch(currentView) {
          case 'selection':
             return (
                <>
                  <DialogHeader>
                    <DialogTitle>¿Qué quieres añadir?</DialogTitle>
                    <DialogDescription>
                      Elige si quieres subir una publicación a tu galería o añadir un producto a tu catálogo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => setCurrentView('upload_gallery')}>
                      <ImageIcon className="w-8 h-8" />
                      Publicar en Galería
                    </Button>
                    <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => setCurrentView('upload_product')}>
                      <PackagePlus className="w-8 h-8" />
                      Añadir Producto
                    </Button>
                  </div>
                </>
              );
          case 'upload_gallery':
            return (
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
                             <Image src={galleryImagePreview} alt="Vista previa" fill style={{objectFit: 'contain'}} sizes="(max-width: 768px) 100vw, 50vw" />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setGalleryImagePreview(null); }}
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
          case 'upload_product':
             return (
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
                                    <Image src={productImagePreview} alt="Vista previa" fill style={{objectFit: 'cover'}} sizes="300px" />
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
          default:
            return null;
      }
  }

  if (!currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderView()}
      </DialogContent>
    </Dialog>
  );
}
