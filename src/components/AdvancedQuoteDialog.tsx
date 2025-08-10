
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Check, Star, Zap } from 'lucide-react';
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";

interface AdvancedQuoteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedOption: string | null;
}

export function AdvancedQuoteDialog({ isOpen, onOpenChange, selectedOption }: AdvancedQuoteDialogProps) {
  const { currentUser, subscribeUser } = useCorabo();
  const router = useRouter();

  const handlePayPerQuote = () => {
    onOpenChange(false);
    // This now redirects to the PRO page which handles the payment logic internally
    router.push(`/quotes/pro?option=${selectedOption}`);
  }

  const handleSubscribe = () => {
    if(!currentUser) return;
    // This will now redirect to the payment page for the subscription
    subscribeUser(currentUser.id, "Plan Personal", 5);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Potencia tu Búsqueda
          </DialogTitle>
          <DialogDescription>
            Elige una opción para enviar tu cotización a los mejores proveedores de la plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

            {/* Option 1: Pay per use */}
            <div className="p-4 border rounded-lg hover:border-primary transition-all">
                <h3 className="font-semibold">Llega a más de 10 cotizaciones personalizadas</h3>
                <p className="text-sm text-muted-foreground mt-1">Tu solicitud será destacada y enviada a proveedores premium y verificados.</p>
                <Button className="w-full mt-4" onClick={handlePayPerQuote}>
                    Pagar y Continuar <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
            
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Separator className="flex-1"/>
                <span>O</span>
                <Separator className="flex-1"/>
            </div>

            {/* Option 2: Subscribe */}
            <div className="p-4 border rounded-lg hover:border-primary transition-all">
                <h3 className="font-semibold">Suscríbete y cotiza sin límites según tu nivel</h3>
                <p className="text-sm text-muted-foreground mt-1">Disfruta de búsquedas avanzadas ilimitadas, insignia de verificado y más.</p>
                <Button className="w-full mt-4" variant="secondary" onClick={handleSubscribe}>
                    <Star className="mr-2 h-4 w-4"/>
                    Suscribirme ahora
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
