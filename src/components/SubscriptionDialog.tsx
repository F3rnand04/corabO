

"use client";

import { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { credicoraLevels, credicoraCompanyLevels } from '@/lib/types';


interface SubscriptionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const plans = {
  personal: {
    title: "Plan Personal",
    description: "Ideal para clientes y proveedores que buscan una base sólida de confianza.",
    price: 5,
    annualPrice: 40,
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
    description: "Dirigido a profesionales con mayor volumen de trabajo o que desean más visibilidad.",
    price: 12,
    annualPrice: 95,
    annualDiscount: "ahorra 33%",
    features: [
      "Todos los beneficios del Plan Personal",
      "Mayor visibilidad en búsquedas",
      "Acceso a oportunidades de negocio prioritarias",
      "Estadísticas básicas de rendimiento",
    ],
  },
  company: {
    title: "Plan Empresa",
    description: "Diseñado para empresas y personas jurídicas que necesitan proyectar máxima confianza.",
    price: 25,
    annualPrice: 190,
    annualDiscount: "ahorra 37.5%",
    features: [
      "Todos los beneficios del Plan Profesional",
      "Gestión Multi-Usuario (Próximamente)",
      "Estadísticas de Perfil Avanzadas",
      "Opciones de Promoción Destacadas",
    ],
  }
};


export function SubscriptionDialog({ isOpen, onOpenChange }: SubscriptionDialogProps) {
  const { currentUser, subscribeUser, updateUser } = useCorabo();
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'annually'>('monthly');

  if (!currentUser) {
    return null;
  }
  
  const isCompany = currentUser.profileSetupData?.providerType === 'company';
  
  const getPlanKey = (): keyof typeof plans => {
    if (isCompany) {
        return 'company';
    }

    if (currentUser.type === 'client') {
      return 'personal';
    }
    
    // Simplified logic for professional plan, avoiding complex queries
    const professionalCategories = ['Salud y Bienestar', 'Educación', 'Automotriz y Repuestos', 'Alimentos y Restaurantes'];
    if (currentUser.type === 'provider') {
      const primaryCategory = currentUser.profileSetupData?.primaryCategory || '';
      const offerType = currentUser.profileSetupData?.offerType;

      if (
        offerType === 'product' ||
        professionalCategories.includes(primaryCategory)
      ) {
        return 'professional';
      }
    }
    return 'personal';
  }

  const currentPlanKey = getPlanKey();
  const currentPlan = plans[currentPlanKey];

  const handleSubscribe = async () => {
    const amount = paymentCycle === 'monthly' ? currentPlan.price : currentPlan.annualPrice;
    
    // Set the user's credicora details upon subscribing
    const currentCredicoraLevel = currentUser.credicoraLevel || 1;
    const credicoraDetails = isCompany ? credicoraCompanyLevels[currentCredicoraLevel.toString()] : credicoraLevels[currentCredicoraLevel.toString()];
    await updateUser(currentUser.id, { credicoraDetails });
    
    subscribeUser(currentUser.id, `Plan ${currentPlan.title} (${paymentCycle === 'monthly' ? 'Mensual' : 'Anual'})`, amount);
    onOpenChange(false);
  }

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
                <div className="pt-2">
                    <RadioGroup value={paymentCycle} onValueChange={(value: 'monthly' | 'annually') => setPaymentCycle(value)}>
                      <div className={cn("flex items-center space-x-2 rounded-lg p-3 border-2 transition-all", paymentCycle === 'monthly' ? 'border-primary bg-primary/5' : 'border-border')}>
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly" className="flex-grow cursor-pointer">
                              <p className="font-bold text-base">{`$${currentPlan.price}`}<span className="font-normal text-sm"> / mes</span></p>
                          </Label>
                      </div>
                      <div className={cn("flex items-center space-x-2 rounded-lg p-3 border-2 transition-all", paymentCycle === 'annually' ? 'border-primary bg-primary/5' : 'border-border')}>
                          <RadioGroupItem value="annually" id="annually" />
                          <Label htmlFor="annually" className="flex-grow cursor-pointer">
                             <p className="font-bold text-base">{`$${currentPlan.annualPrice}`}<span className="font-normal text-sm"> / año</span></p>
                             <p className="font-semibold text-green-600 text-xs uppercase">{currentPlan.annualDiscount}</p>
                          </Label>
                      </div>
                    </RadioGroup>
                </div>
                <p className='text-xs text-muted-foreground text-center italic'>Los precios incluyen IVA (16%).</p>
            </div>
        )}
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>¡Invierte en tu tranquilidad!</AlertTitle>
            <AlertDescription>
                En CorabO, recomendamos siempre transaccionar con usuarios verificados. La insignia azul de 'Verificado' es tu confirmación de que este usuario ha completado un riguroso proceso de validación, brindando una capa adicional de seguridad y confianza en todas tus interacciones.
            </AlertDescription>
        </Alert>

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {currentUser.isSubscribed ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!currentUser.isSubscribed && (
            <Button onClick={handleSubscribe}>
                <Check className="mr-2 h-4 w-4" />
                Suscribirse ahora
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
