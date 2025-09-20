
'use client';

import { Card } from "@/components/ui/card";
import { Truck, Wrench, BedDouble, Earth } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';
import { useAuth } from "@/hooks/use-auth";

interface Step1ProfileTypeProps {
  onUpdateAndNext: (data: Partial<ProfileSetupData>) => void;
}

const StepCard = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
    <Card 
        className="text-center p-6 hover:border-primary cursor-pointer transition-all"
        onClick={onClick}
    >
      <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
);

export default function Step1ProfileType({ onUpdateAndNext }: Step1ProfileTypeProps) {
    const { setCurrentUser } = useAuth();

    const handleSelect = (type: 'professional' | 'delivery' | 'lodging' | 'tourism') => {
        let primaryCategory = '';
        if(type === 'lodging' || type === 'tourism') {
            primaryCategory = 'Turismo y Estadías';
        }

        const data = { providerType: type, primaryCategory };
        
        setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
        onUpdateAndNext(data);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold">Paso 1: Elige tu tipo de perfil</h2>
                <p className="text-sm text-muted-foreground">¿Cómo quieres participar en Corabo?</p>
            </div>
            <div className="space-y-4">
                <StepCard
                    icon={Wrench}
                    title="Proveedor de Servicios"
                    description="Ofrece tus habilidades y talentos profesionales o vende tus productos en otras categorías."
                    onClick={() => handleSelect('professional')}
                />
                 <StepCard
                    icon={BedDouble}
                    title="Proveedor de Hospedaje"
                    description="Ofrece alojamientos como hoteles, apartamentos, casas o habitaciones."
                    onClick={() => handleSelect('lodging')}
                />
                 <StepCard
                    icon={Earth}
                    title="Proveedor de Turismo"
                    description="Ofrece paquetes turísticos, tours y experiencias guiadas."
                    onClick={() => handleSelect('tourism')}
                />
                <StepCard
                    icon={Truck}
                    title="Repartidor (Delivery)"
                    description="Únete a nuestra red de logística para realizar entregas y fletes."
                    onClick={() => handleSelect('delivery')}
                />
            </div>
        </div>
    );
}
