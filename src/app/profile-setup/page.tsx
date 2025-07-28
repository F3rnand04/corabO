
'use client';

import { useState } from 'react';
import { Stepper } from '@/components/profile-setup/Stepper';
import Step1_ProfileType from '@/components/profile-setup/Step1_ProfileType';
import Step2_Username from '@/components/profile-setup/Step2_Username';
import Step3_Category from '@/components/profile-setup/Step3_Category';
import Step4_GeneralDetails from '@/components/profile-setup/Step4_GeneralDetails';
import Step5_SpecificDetails from '@/components/profile-setup/Step5_SpecificDetails';
import Step6_Review from '@/components/profile-setup/Step6_Review';
import { useCorabo } from '@/contexts/CoraboContext';

const steps = [
  { id: 1, name: 'Tipo de Perfil' },
  { id: 2, name: 'Nombre de Usuario' },
  { id: 3, name: 'Categoría' },
  { id: 4, name: 'Detalles Generales' },
  { id: 5, name: 'Detalles Específicos' },
  { id: 6, name: 'Revisión Final' },
];

export default function ProfileSetupPage() {
  const { currentUser } = useCorabo();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileType, setProfileType] = useState(currentUser.type);
  const [formData, setFormData] = useState({
      username: currentUser.name,
      categories: [],
      fullName: '',
      email: '',
      phone: '',
      bio: '',
      gallery: [],
      schedule: {},
      serviceArea: '',
  });

  const handleNext = () => {
    // For 'client', skip step 3 and 5
    if (profileType === 'client' && currentStep === 2) {
      setCurrentStep(4);
    } else if (profileType === 'client' && currentStep === 4) {
      setCurrentStep(6);
    }
    else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    // For 'client', skip step 3 and 5
    if (profileType === 'client' && currentStep === 4) {
      setCurrentStep(2);
    } else if (profileType === 'client' && currentStep === 6) {
        setCurrentStep(4);
    }
    else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleProfileTypeSelect = (type: 'client' | 'provider') => {
    setProfileType(type);
    handleNext();
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_ProfileType onSelect={handleProfileTypeSelect} currentType={profileType} />;
      case 2:
        return <Step2_Username onBack={handleBack} onNext={handleNext} />;
      case 3:
        return <Step3_Category onBack={handleBack} onNext={handleNext} />;
      case 4:
        return <Step4_GeneralDetails onBack={handleBack} onNext={handleNext} />;
      case 5:
        return <Step5_SpecificDetails onBack={handleBack} onNext={handleNext} />;
      case 6:
        return <Step6_Review onBack={handleBack} />;
      default:
        return <Step1_ProfileType onSelect={handleProfileTypeSelect} currentType={profileType} />;
    }
  };

  const relevantSteps = steps.filter(step => {
    if (profileType === 'client' && (step.id === 3 || step.id === 5)) {
      return false;
    }
    return true;
  });
  
  const currentRelevantStepIndex = relevantSteps.findIndex(s => s.id === currentStep);

  return (
    <main className="container max-w-4xl mx-auto py-8">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-center">Configuración de Perfil</h1>
        <p className="text-center text-muted-foreground">
          Aquí puedes actualizar tu información y ajustar cómo te ven otros usuarios.
        </p>
        
        <Stepper steps={relevantSteps} currentStep={currentRelevantStepIndex + 1} />

        <div className="bg-background p-6 md:p-8 rounded-2xl shadow-lg border">
            {renderStep()}
        </div>
      </div>
    </main>
  );
}
