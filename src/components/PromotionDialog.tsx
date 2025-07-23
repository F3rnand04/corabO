
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
import { Zap, Clock } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

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

export function PromotionDialog({ isOpen, onOpenChange, onActivate, image, isPromotionActive }: PromotionDialogProps) {
  const [promotionText, setPromotionText] = useState('HOY 10% OFF');

  if (!image) return null;

  const handleActivate = () => {
    if (promotionText.trim()) {
      onActivate(promotionText);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Promoción del Día
          </DialogTitle>
          <DialogDescription>
            Destaca esta imagen en el feed principal durante 24 horas.
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
            <div className="space-y-4 py-4">
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
                />
              </div>
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>Costo de Activación: $2.50</AlertTitle>
                <AlertDescription>
                  Se realizará un único cargo a tu método de pago. La promoción durará 24 horas.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!isPromotionActive && (
            <Button onClick={handleActivate} disabled={!promotionText.trim()}>
              Activar Promoción por $2.50
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
