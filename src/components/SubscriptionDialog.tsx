
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
import { Check, CheckCircle, Star, Info } from 'lucide-react';
import { useCorabo } from "@/contexts/CoraboContext";

interface SubscriptionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const plans = {
  personal: {
    title: "Plan Personal",
    description: "Ideal para Clientes y prestadores básicos que buscan establecer una base sólida de confianza y credibilidad.",
    price: "$5 USD/mes",
    annualPrice: "$40 USD/año",
    annualDiscount: "ahorra 33%",
    features: [
      "Verificación de Identidad Rigurosa",
      "Insignia de Perfil Verificado",
      "Construye una reputación sólida",
      "Soporte Prioritario",
    ],
  },
  professional: {
    title: "Plan Profesional",
    description: "Dirigido a profesionales con un mayor volumen de trabajo o que desean mayor visibilidad.",
    price: "$12 USD/mes",
    annualPrice: "$95 USD/año",
    annualDiscount: "ahorra 33%",
    features: [
      "Todos los beneficios del Plan Personal",
      "Mayor visibilidad en búsquedas",
      "Acceso a oportunidades de negocio prioritarias",
      "Estadísticas de rendimiento básicas",
    ],
  },
  company: {
    title: "Plan Empresarial",
    description: "Diseñado para empresas y entidades jurídicas que necesitan proyectar una imagen de máxima confianza.",
    price: "$25 USD/mes",
    annualPrice: "$190 USD/año",
    annualDiscount: "ahorra 37.5%",
    features: [
      "Todos los beneficios del Plan Profesional",
      "Gestión de Múltiples Usuarios (Próximamente)",
      "Estadísticas Avanzadas de Perfil",
      "Opciones de Promoción Destacadas",
    ],
  }
};


export function SubscriptionDialog({ isOpen, onOpenChange }: SubscriptionDialogProps) {
  const { currentUser, transactions, subscribeUser } = useCorabo();

  const handleSubscribe = () => {
    subscribeUser(currentUser.id);
    onOpenChange(false);
  }
  
  const getCompletedJobs = () => {
    if (currentUser.type !== 'provider') return 0;
    return transactions.filter(
      tx => tx.providerId === currentUser.id && (tx.status === 'Pagado' || tx.status === 'Resuelto')
    ).length;
  }

  const getPlanKey = (): keyof typeof plans => {
    if (currentUser.type === 'client') return 'personal';
    if (currentUser.profileSetupData?.providerType === 'company') return 'company';
    if (getCompletedJobs() <= 15) return 'personal';
    return 'professional';
  }

  const currentPlanKey = getPlanKey();
  const currentPlan = plans[currentPlanKey];

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
                <ul className="space-y-2 list-inside text-sm text-muted-foreground">
                    {currentPlan.features.map(feature => (
                       <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0"/> 
                        <span>{feature}</span>
                    </li>
                    ))}
                </ul>
                <div className="text-center pt-2">
                  <p className="font-bold text-lg">{currentPlan.price}</p>
                  <p className="text-sm font-semibold">{currentPlan.annualPrice} <span className="text-green-600 font-bold">({currentPlan.annualDiscount})</span></p>
                </div>
            </div>
        )}
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>¡Invierte en tu tranquilidad!</AlertTitle>
            <AlertDescription>
                En CorabO, siempre recomendamos realizar transacciones con usuarios verificados. La insignia azul de 'Verificado' es tu confirmación de que ese usuario ha completado un proceso de validación riguroso, proporcionando una capa adicional de seguridad y confianza en todas tus interacciones.
            </AlertDescription>
        </Alert>

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
