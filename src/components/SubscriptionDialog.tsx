
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
import { Check, CheckCircle, Star } from 'lucide-react';
import { useCorabo } from "@/contexts/CoraboContext";

interface SubscriptionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ isOpen, onOpenChange }: SubscriptionDialogProps) {
  const { currentUser, subscribeUser } = useCorabo();

  const handleSubscribe = () => {
    subscribeUser(currentUser.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-yellow-500" />
            Plan de Suscripción
          </DialogTitle>
          <DialogDescription>
            Obtén la insignia de verificado y amplía tu alcance.
          </DialogDescription>
        </DialogHeader>

        {currentUser.isSubscribed ? (
           <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 !text-green-800" />
                <AlertTitle>¡Ya estás suscrito!</AlertTitle>
                <AlertDescription>
                 Disfrutas de todos los beneficios, incluyendo la insignia de verificado y un radio de búsqueda ampliado.
                </AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-4 py-4">
                <p>Conviértete en un miembro verificado de la comunidad Corabo y disfruta de beneficios exclusivos:</p>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Insignia de perfil verificado.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Mayor visibilidad en las búsquedas.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Radio de acción ampliado sin límites.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Acceso a soporte prioritario.</li>
                </ul>
                <p className="font-bold text-center text-lg">Precio: $9.99 / mes</p>
            </div>
        )}

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {currentUser.isSubscribed ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!currentUser.isSubscribed && (
            <Button onClick={handleSubscribe}>
                <Check className="mr-2 h-4 w-4" />
                Confirmar Suscripción
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
