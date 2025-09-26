

"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Flag, EyeOff, UserX, Loader2 } from 'lucide-react';
import { Switch } from './ui/switch';


interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  providerId: string;
  publicationId: string;
}

const reportReasons = ["Contenido Ofensivo", "Información Falsa", "Es Spam", "Intento de Fraude"];

export function ReportDialog({ isOpen, onOpenChange, providerId, publicationId }: ReportDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [hideContent, setHideContent] = useState(false);
  const [hideProvider, setHideProvider] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendReport = () => {
    if (!reason && !description) {
        toast({
            variant: "destructive",
            title: "Falta información",
            description: "Por favor, selecciona un motivo o escribe una descripción."
        });
        return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Denuncia Enviada",
            description: "Gracias por ayudarnos a mantener la comunidad segura. Revisaremos tu denuncia a la brevedad."
        });
        
        // Reset and close
        setReason("");
        setDescription("");
        setHideContent(false);
        setHideProvider(false);
        setIsSubmitting(false);
        onOpenChange(false);
    }, 1000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Denunciar Publicación
          </DialogTitle>
          <DialogDescription>
            Ayúdanos a entender qué problema tiene esta publicación. Tu reporte es anónimo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            <div className="space-y-3">
                <Label>Motivo (selecciona uno o más)</Label>
                <div className="flex flex-wrap gap-2">
                    {reportReasons.map(r => (
                        <Button 
                            key={r}
                            variant={reason === r ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => setReason(r)}
                        >
                            {r}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea 
                    id="description"
                    placeholder="Danos más detalles sobre el problema..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="hide-content" className="flex items-center gap-3 cursor-pointer">
                        <EyeOff className="w-5 h-5" />
                        No mostrar más este tipo de contenido
                    </Label>
                    <Switch 
                        id="hide-content"
                        checked={hideContent}
                        onCheckedChange={setHideContent}
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="hide-provider" className="flex items-center gap-3 cursor-pointer">
                        <UserX className="w-5 h-5" />
                        No mostrar más a este proveedor
                    </Label>
                    <Switch 
                        id="hide-provider"
                        checked={hideProvider}
                        onCheckedChange={setHideProvider}
                    />
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSendReport} disabled={isSubmitting || (!reason && !description)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Enviar Denuncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
