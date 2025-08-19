
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { ProfileSetupData, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProgressBar } from '@/components/ui/progress-bar'; // Assuming a new progress bar component

// Import Step Components
import Step1_ProfileType from '@/components/profile-setup/Step1_ProfileType';
import Step2_CompanyInfo from '@/components/profile-setup/Step2_CompanyInfo';
import Step3_Logistics from '@/components/profile-setup/Step3_Logistics';
import Step4_LegalInfo from '@/components/profile-setup/Step4_LegalInfo';
import Step5_Review from '@/components/profile-setup/Step5_Review';

export default function ProfileSetupPage() {
  const { currentUser, updateUser } = useCorabo();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProfileSetupData>(() => currentUser?.profileSetupData || {});
  
  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const totalSteps = 5;

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleUpdateFormData = (data: Partial<ProfileSetupData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
        await updateUser(currentUser.id, { profileSetupData: formData, isInitialSetupComplete: true });
        toast({ title: "¡Perfil de Empresa Configurado!", description: "Tus datos han sido guardados."});
        // Redirect logic will be handled by AppLayout
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
        return <Step1_ProfileType onSelect={(type, providerType) => handleUpdateFormData({ providerType })} currentType={formData.providerType} onNext={handleNext} />;
      case 2:
        return <Step2_CompanyInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 3:
        return <Step3_Logistics formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 4:
        return <Step4_LegalInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 5:
        return <Step5_Review formData={formData} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
      default:
        return <p>Paso desconocido.</p>;
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-8">
            {step > 1 && (
                <Button variant="ghost" onClick={handleBack} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Atrás
                </Button>
            )}
            <ProgressBar current={step} total={totalSteps} />
        </div>
        {renderStep()}
    </div>
  );
}
