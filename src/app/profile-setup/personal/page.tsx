'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useRouter } from 'next/navigation';
import { updateFullProfile } from '@/lib/actions/user.actions';

// Import Step Components
import Step1_ProfileType from '@/components/profile-setup/personal/Step1_ProfileType';
import Step3_Category from '@/components/profile-setup/personal/Step3_Category';
import Step4_Logistics from '@/components/profile-setup/personal/Step4_Logistics';
import Step6_Review from '@/components/profile-setup/personal/Step6_Review';


export default function PersonalProviderSetupPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ProfileSetupData>>(currentUser?.profileSetupData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(prev => ({ ...prev, ...currentUser.profileSetupData }));
    }
  }, [currentUser]);
  
  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }

  const totalSteps = 4; // Type -> Category -> Logistics -> Review

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => {
    if (step === 1) {
      router.push('/profile');
    } else {
      setStep(prev => prev - 1);
    }
  };

  const onUpdate = (data: Partial<ProfileSetupData>) => {
    setFormData(prev => ({...prev, ...data}));
  };
  
  const handleUpdateAndNext = (data: Partial<ProfileSetupData>) => {
    onUpdate(data);
    handleNext();
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const finalData = { ...formData };
    try {
        await updateFullProfile(currentUser.id, finalData as ProfileSetupData, finalData.providerType === 'delivery' ? 'repartidor' : 'provider');
        toast({ title: "¡Felicidades, ya eres proveedor!", description: "Tu perfil ha sido actualizado." });
        router.push('/profile');
    } catch(error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "No se pudo guardar tu configuración." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_ProfileType onUpdateAndNext={handleUpdateAndNext} />;
      case 2:
        return <Step3_Category formData={formData} onUpdate={onUpdate} onNext={handleNext} />;
      case 3:
        return <Step4_Logistics formData={formData} onUpdate={onUpdate} onNext={handleNext} />;
      case 4:
        return <Step6_Review formData={formData} onUpdate={onUpdate} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
      default:
        return <p>Paso desconocido</p>;
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-8">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Atrás
            </Button>
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Paso {step} de {totalSteps}</p>
                <ProgressBar current={step} total={totalSteps} />
            </div>
        </div>
        {renderStep()}
    </div>
  );
}
