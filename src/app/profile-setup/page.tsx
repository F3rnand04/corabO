
'use client';

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useRouter, useSearchParams } from 'next/navigation';

// Import Step Components
import Step2_CompanyInfo from '@/components/profile-setup/Step2_CompanyInfo';
import Step3_Logistics from '@/components/profile-setup/Step3_Logistics';
import Step4_LegalInfo from '@/components/profile-setup/Step4_LegalInfo';
import Step5_Review from '@/components/profile-setup/Step5_Review';

export default function ProfileSetupPage() {
  const { currentUser, updateFullProfile, deliveryAddress, setDeliveryAddress } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileSetupData>(() => currentUser?.profileSetupData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(prev => ({ ...prev, ...currentUser.profileSetupData }));
    }
  }, [currentUser]);

  useEffect(() => {
    // When returning from map, update the location in the form state
    if (deliveryAddress && deliveryAddress !== formData.location) {
      setFormData(prev => ({ ...prev, location: deliveryAddress }));
      // Clear the address from context so it doesn't persist incorrectly
      setDeliveryAddress(''); 
    }
  }, [deliveryAddress, formData.location, setDeliveryAddress]);
  
   useEffect(() => {
    // This effect handles returning from the map view
    const fromMap = searchParams.get('fromMap');
    if (fromMap) {
      // When returning from map, we should be on the logistics step
      setStep(2); 
      // Clean up the URL query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('fromMap');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const totalSteps = 4; // Info, Logistics, Legal, Review

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  
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
        return <Step2_CompanyInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 2:
        return <Step3_Logistics formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 3:
        return <Step4_LegalInfo formData={formData} onUpdate={handleUpdateFormData} onNext={handleNext} />;
      case 4:
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
