
'use client';

import { Card } from "@/components/ui/card";
import { Truck, Wrench } from "lucide-react";
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

    const handleSelect = (type: 'professional' | 'delivery') => {
        const data = { providerType: type };
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
                    description="Ofrece tus habilidades y talentos profesionales o vende tus productos."
                    onClick={() => handleSelect('professional')}
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
