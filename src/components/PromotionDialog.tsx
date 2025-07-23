
"use client";

import { useState } from 'react';
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
import { Zap, Clock, ChevronDown, Upload, Check } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

type GalleryImage = {
  src: string;
  alt: string;
  description: string;
  promotion?: {
    text: string;
    expires: string;
  };
};

interface PromotionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActivate: (promotionText: string) => void;
  image: GalleryImage | null;
  isPromotionActive: boolean;
}

const promotionSuggestions = ["10% OFF", "2x1 Hoy", "Envío Gratis", "Oferta Especial", "Nuevo"];
const costPerDay = 2.50;

export function PromotionDialog({ isOpen, onOpenChange, onActivate, image, isPromotionActive }: PromotionDialogProps) {
  const [promotionText, setPromotionText] = useState('HOY 10% OFF');
  const [duration, setDuration] = useState<"24" | "48" | "72">("24");
  const [reference, setReference] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isPaymentSectionOpen, setIsPaymentSectionOpen] = useState(false);

  if (!image) return null;

  const handleActivate = () => {
    if (promotionText.trim() && reference && voucherFile) {
      onActivate(promotionText);
    }
  };
  
  const promotionCost = (parseInt(duration) / 24) * costPerDay;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Promoción del Día
          </DialogTitle>
          <DialogDescription>
            Destaca esta imagen en el feed principal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-4 -mr-4">
          {isPromotionActive && image.promotion ? (
            <div className="py-4">
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <Clock className="h-4 w-4 !text-green-800" />
                <AlertTitle>Promoción Activa</AlertTitle>
                <AlertDescription>
                  Esta imagen ya está promocionada. La oferta
                  <Badge variant="secondary" className="mx-1">{image.promotion.text}</Badge>
                  expirará en menos de 24 horas.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="relative aspect-video w-full rounded-md overflow-hidden">
                <Image src={image.src} alt={image.alt} layout="fill" objectFit="cover" data-ai-hint="promotional image"/>
                <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
                  {promotionText || "Tu Oferta Aquí"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promotion-text">Texto de la Oferta</Label>
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

               <div className="space-y-3">
                 <Label>Duración y Costo</Label>
                 <RadioGroup value={duration} onValueChange={(value: "24" | "48" | "72") => setDuration(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="24" id="d24" />
                        <Label htmlFor="d24">24 horas - <span className="font-bold">${(costPerDay).toFixed(2)}</span></Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="48" id="d48" />
                        <Label htmlFor="d48">48 horas - <span className="font-bold">${(costPerDay * 2).toFixed(2)}</span></Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="72" id="d72" />
                        <Label htmlFor="d72">72 horas - <span className="font-bold">${(costPerDay * 3).toFixed(2)}</span></Label>
                    </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Button 
                    variant="default" 
                    className="w-full" 
                    disabled={!promotionText.trim() || isPromotionActive}
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
                         <Button onClick={handleActivate} disabled={!reference || !voucherFile} className="w-full">
                           <Check className="mr-2 h-4 w-4" />
                           Confirmar Pago
                         </Button>
                       </div>
                     </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isPromotionActive ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
