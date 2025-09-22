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
import Step1_CompanyInfo from '@/components/profile-setup/company/Step1_CompanyInfo';
import Step2_Logistics from '@/components/profile-setup/company/Step2_Logistics';
import Step3_LegalInfo from '@/components/profile-setup/company/Step3_LegalInfo';
import Step4_Review from '@/components/profile-setup/company/Step4_Review';


export default function ProfileSetupPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileSetupData>(currentUser?.profileSetupData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(prev => ({ ...prev, ...currentUser.profileSetupData }));
    }
  }, [currentUser]);
  
  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const totalSteps = 4; // Info, Logistics, Legal, Review

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => {
    if (step === 1) {
      router.push('/profile');
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };
  
  const handleUpdateFormData = (data: Partial<ProfileSetupData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
        await updateFullProfile(currentUser.id, formData, 'provider');
        toast({ title: "¡Perfil de Empresa Configurado!", description: "Tus datos han sido guardados."});
        router.push('/profile');
    } catch(error) {
        console.error("Error submitting profile data:", error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudo guardar la información."});
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_CompanyInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 2:
        return <Step2_Logistics formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 3:
        return <Step3_LegalInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 4:
        return <Step4_Review formData={formData} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
      default:
        return <p>Paso desconocido.</p>;
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
