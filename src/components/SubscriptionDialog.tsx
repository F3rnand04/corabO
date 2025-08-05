
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

const plans = {
  client: {
    title: "Plan Cliente Seguro",
    description: "Maximiza la seguridad y el control en todas tus compras y transacciones.",
    price: "$1.99 / mes",
    features: [
      { text: "Registro de Transacciones Seguro:", description: "Activa tu historial para compras seguras y con seguimiento." },
      { text: "Acceso a Credicora:", description: "Opta por facilidades de pago en comercios afiliados (sujeto a aprobación)." },
      { text: "Reputación de Comprador:", description: "Construye un historial como comprador confiable en la plataforma." },
      { text: "Soporte Prioritario:", description: "Recibe ayuda más rápido cuando la necesites." },
    ],
  },
  professional: {
    title: "Plan Profesional Verificado",
    description: "Obtén la insignia de verificado, amplía tu alcance y genera más confianza.",
    price: "$9.99 / mes",
    features: [
      { text: "Insignia de Perfil Verificado:", description: "Aumenta la confianza de tus clientes potenciales." },
      { text: "Mayor Visibilidad:", description: "Aparece en más resultados de búsqueda." },
      { text: "Alcance sin Límites:", description: "Ofrece tus servicios o busca sin restricciones de distancia." },
      { text: "Soporte Prioritario:", description: "Recibe ayuda más rápido cuando la necesites." },
    ],
  },
  company: {
    title: "Plan Empresa Plus",
    description: "Potencia tu negocio con herramientas avanzadas y máxima visibilidad.",
    price: "$19.99 / mes",
    features: [
      { text: "Todos los beneficios del Plan Profesional.", description: "" },
      { text: "Gestión de Múltiples Usuarios:", description: "Permite que varios miembros de tu equipo gestionen el perfil (próximamente)." },
      { text: "Estadísticas Avanzadas:", description: "Analiza el rendimiento de tu perfil y publicaciones." },
      { text: "Promociones Destacadas:", description: "Accede a mejores opciones para destacar tus ofertas en el feed principal." },
    ],
  }
};


export function SubscriptionDialog({ isOpen, onOpenChange }: SubscriptionDialogProps) {
  const { currentUser, subscribeUser } = useCorabo();

  const handleSubscribe = () => {
    subscribeUser(currentUser.id);
    onOpenChange(false);
  }

  const getPlanKey = () => {
    if (currentUser.type === 'client') return 'client';
    if (currentUser.profileSetupData?.providerType === 'company') return 'company';
    return 'professional';
  }

  const currentPlan = plans[getPlanKey()];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-yellow-500" />
            {currentPlan.title}
          </DialogTitle>
          <DialogDescription>
            {currentPlan.description}
          </DialogDescription>
        </DialogHeader>

        {currentUser.isSubscribed ? (
           <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 !text-green-800" />
                <AlertTitle>¡Ya estás suscrito!</AlertTitle>
                <AlertDescription>
                 Disfrutas de todos los beneficios de tu plan actual.
                </AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-4 py-4">
                <p>Conviértete en un miembro verificado de la comunidad Corabo y disfruta de beneficios exclusivos:</p>
                <ul className="space-y-2 list-inside text-sm text-muted-foreground">
                    {currentPlan.features.map(feature => (
                       <li key={feature.text} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0"/> 
                        <span>
                            <span className="font-semibold text-foreground">{feature.text}</span>
                            {feature.description && ` ${feature.description}`}
                        </span>
                    </li>
                    ))}
                </ul>
                <p className="font-bold text-center text-lg pt-2">Precio: {currentPlan.price}</p>
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
