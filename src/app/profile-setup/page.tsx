
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import Step1_ProfileType from './Step1_ProfileType';
// NOTE: We will create the new step components later.
// For now, this component will manage the flow.

export default function ProfileSetupPage() {
  const { currentUser, updateUser } = useCorabo();
  const [step, setStep] = useState(1);

  // This will hold the complete profile data as we build it
  const [formData, setFormData] = useState(() => currentUser?.profileSetupData || {});

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  
  const handleUpdateFormData = (data: any) => {
    setFormData(prev => ({...prev, ...data}));
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_ProfileType 
                    onSelect={(type, providerType) => handleUpdateFormData({ type, providerType })}
                    currentType={formData.type || 'client'}
                    onNext={handleNext}
                />;
      // Other steps will be added here
      default:
        return <p>Paso desconocido. Por favor, recarga la página.</p>;
    }
  }

  if (!currentUser) return null; // Or a loading state

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {renderStep()}
    </div>
  );
}
