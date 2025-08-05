
"use client";

import { useState, ChangeEvent, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from './ui/badge';
import { Zap, Clock, ChevronDown, Upload, Check, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';

interface PromotionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const promotionSuggestions = ["10% OFF", "2x1 Hoy", "Envío Gratis", "Oferta Especial", "Nuevo"];

export function PromotionDialog({ isOpen, onOpenChange }: PromotionDialogProps) {
  const { currentUser, activatePromotion, updateUserProfileAndGallery } = useCorabo();
  const { toast } = useToast();
  
  // State for provider view
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // State for client/temporary view
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  // Common state
  const [promotionText, setPromotionText] = useState('');
  const [reference, setReference] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isPaymentSectionOpen, setIsPaymentSectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProviderWithGallery = currentUser.type === 'provider' && currentUser.gallery && currentUser.gallery.length > 0;
  
  const getPromotionCost = () => {
    switch (currentUser.type) {      
      case 'provider':
        return 8;
      case 'client':
      default:
        return 5;
    }
  }
  const promotionCost = getPromotionCost();

  const handleTempFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTempImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    // Reset all state
    setSelectedImage(null);
    setTempImageFile(null);
    setTempImagePreview(null);
    setTempDescription('');
    setPromotionText('');
    setReference('');
    setVoucherFile(null);
    setIsPaymentSectionOpen(false);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleActivate = () => {
    if (!reference || !voucherFile) {
        toast({ variant: "destructive", title: "Faltan datos de pago", description: "Sube el comprobante y añade la referencia." });
        return;
    }

    setIsSubmitting(true);

    if (isProviderWithGallery) {
      if (!selectedImage) {
        toast({ variant: "destructive", title: "Selecciona una imagen", description: "Debes elegir una de tus publicaciones para promocionar." });
        setIsSubmitting(false);
        return;
      }
      activatePromotion({ imageId: selectedImage, promotionText, cost: promotionCost });
    } else {
      if (!tempImageFile || !tempDescription.trim()) {
        toast({ variant: "destructive", title: "Falta información", description: "Por favor, sube una imagen y añade una descripción para tu oferta." });
        setIsSubmitting(false);
        return;
      }
      // For clients, we first create the temporary publication, then promote it.
      const newTempImage = {
        id: `temp-${Date.now()}`,
        src: tempImagePreview!,
        alt: tempDescription.slice(0, 30),
        description: tempDescription,
        comments: [],
        isTemporary: true,
      };
      updateUserProfileAndGallery(currentUser.id, newTempImage);
      activatePromotion({ imageId: newTempImage.id, promotionText, cost: promotionCost });
    }

    setTimeout(() => { // Simulate processing time
        toast({ title: "¡Promoción Activada!", description: "Tu oferta destacará por 24 horas." });
        handleClose();
    }, 1500);
  };

  const currentImageToDisplay = isProviderWithGallery
    ? currentUser.gallery?.find(img => img.id === selectedImage)?.src
    : tempImagePreview;

  const activePromotion = currentUser.gallery?.find(g => g.promotion && new Date(g.promotion.expires) > new Date());
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Emprende por Hoy: ¡Tu Idea en el Mercado por 24h!
          </DialogTitle>
          <DialogDescription>
            ¿Tienes un talento oculto o una idea brillante? ¡Hoy es el día de probarla! Lanza un producto o servicio por 24 horas y muestra al mundo lo que eres capaz de hacer. Es tu oportunidad de conectar, vender y convertir una pasión en tu próximo gran éxito.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-4 -mr-4">
          {activePromotion ? (
            <div className="py-4">
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <Clock className="h-4 w-4 !text-green-800" />
                <AlertTitle>¡Ya tienes una promoción activa!</AlertTitle>
                <AlertDescription>
                  La oferta <Badge variant="secondary" className="mx-1">{activePromotion.promotion?.text}</Badge> expirará pronto. Solo se puede tener una promoción activa a la vez.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              
              {/* Image Selection / Upload */}
              {isProviderWithGallery ? (
                <div>
                  <Label className="mb-2 block">Elige qué promocionar</Label>
                  <ScrollArea className="h-32">
                    <div className="flex gap-2 pr-2">
                      {currentUser.gallery?.map(img => (
                        <div key={img.id} className="relative shrink-0 w-28 h-28 cursor-pointer rounded-md overflow-hidden" onClick={() => setSelectedImage(img.id)}>
                          <Image src={img.src} alt={img.alt} fill className="object-cover" />
                          {selectedImage === img.id && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Check className="text-white w-10 h-10"/></div>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="temp-desc">Describe tu oferta</Label>
                  <Textarea id="temp-desc" placeholder="Ej: Vendo deliciosas tortas de chocolate por encargo..." value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} />
                  <Label htmlFor="temp-img">Sube una imagen</Label>
                  <Input id="temp-img" type="file" accept="image/*" onChange={handleTempFileChange} />
                </div>
              )}

              {/* Promotion Preview */}
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                {currentImageToDisplay ? (
                    <Image src={currentImageToDisplay} alt="Vista previa" layout="fill" objectFit="cover" data-ai-hint="promotional image"/>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Elige o sube una imagen</div>
                )}
                {promotionText && (
                  <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
                    {promotionText}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promotion-text">Texto de la Oferta (Opcional)</Label>
                <Input
                  id="promotion-text"
                  value={promotionText}
                  onChange={(e) => setPromotionText(e.target.value)}
                  placeholder="Ej: HOY 15% OFF"
                  maxLength={15}
                />
                <div className="flex flex-wrap gap-1 pt-1">
                    {promotionSuggestions.map(suggestion => (
                        <Badge 
                            key={suggestion} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => setPromotionText(suggestion)}
                        >
                            {suggestion}
                        </Badge>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                    variant="default" 
                    className="w-full" 
                    disabled={activePromotion}
                    onClick={() => setIsPaymentSectionOpen(!isPaymentSectionOpen)}
                >
                    <span>Activar por ${promotionCost.toFixed(2)}</span>
                    <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isPaymentSectionOpen && "rotate-180")} />
                </Button>

                {isPaymentSectionOpen && (
                     <div className="py-4 px-3 mt-2 border rounded-md bg-muted/50">
                       <div className="space-y-4">
                         <p className="text-sm font-semibold text-foreground">Realiza el pago a los siguientes datos:</p>
                         <div className="text-sm text-muted-foreground bg-background p-3 rounded-md space-y-1">
                            <p><strong>Banco:</strong> Banco de Corabo</p>
                            <p><strong>Teléfono:</strong> 0412-1234567</p>
                            <p><strong>RIF:</strong> J-12345678-9</p>
                         </div>
                         <p className="text-sm font-semibold text-foreground pt-2">Luego, registra tu pago aquí:</p>
                         <div className="space-y-2">
                            <Label htmlFor="voucher-upload">Comprobante de Pago</Label>
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="icon"><Label htmlFor="voucher-upload" className="cursor-pointer"><Upload className="h-4 w-4"/></Label></Button>
                               <Input 
                                  id="voucher-upload" 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)}
                                />
                               <span className={cn("text-sm text-muted-foreground", voucherFile && "text-foreground font-medium")}>
                                 {voucherFile ? voucherFile.name : 'Seleccionar archivo...'}
                               </span>
                            </div>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="reference">Número de Referencia</Label>
                           <Input id="reference" placeholder="00012345" value={reference} onChange={(e) => setReference(e.target.value)} />
                         </div>
                       </div>
                     </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {activePromotion ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!activePromotion && (
            <Button onClick={handleActivate} disabled={!isPaymentSectionOpen || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Procesando...' : 'Confirmar y Activar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
