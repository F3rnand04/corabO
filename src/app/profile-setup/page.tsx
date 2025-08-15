
'use client';

import { useState, useEffect } from 'react';
import { Stepper } from '@/components/profile-setup/Stepper';
import Step1_ProfileType from './Step1_ProfileType';
import Step2_Username from '@/components/profile-setup/Step2_Username';
import Step3_Category from '@/components/profile-setup/Step3_Category';
import Step4_GeneralDetails from '@/components/profile-setup/Step4_GeneralDetails';
import Step5_SpecificDetails from './Step5_SpecificDetails';
import Step6_Review from '@/components/profile-setup/Step6_Review';
import { useCorabo } from '@/contexts/CoraboContext';
import type { ProfileSetupData, User as UserType } from '@/lib/types';
import { Loader2 } from 'lucide-react';


const steps = [
  { id: 1, name: 'Tipo de Perfil' },
  { id: 2, name: 'Nombre de Usuario' },
  { id: 3, name: 'Categoría' },
  { id: 4, name: 'Detalles Generales' },
  { id: 5, name: 'Detalles Específicos' },
  { id: 6, name: 'Revisión Final' },
];

const initialSchedule = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].reduce((acc, day) => {
    acc[day] = { from: '09:00', to: '17:00', active: true };
    return acc;
}, {} as ProfileSetupData['schedule']);
['Sábado', 'Domingo'].forEach(day => {
  if(initialSchedule){
    initialSchedule[day] = { from: '09:00', to: '17:00', active: false };
  }
});


export default function ProfileSetupPage() {
  const { currentUser } = useCorabo();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileType, setProfileType] = useState<UserType['type'] | null>(null);
  const [formData, setFormData] = useState<ProfileSetupData>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // This effect ensures formData is always in sync with the latest currentUser data.
    if (currentUser) {
        setProfileType(currentUser.type);
        setFormData({
            ...currentUser.profileSetupData,
            schedule: currentUser.profileSetupData?.schedule || initialSchedule,
            username: currentUser.profileSetupData?.username || currentUser.name || '',
            email: currentUser.email,
            phone: currentUser.phone,
        });
        setIsLoading(false);
    }
  }, [currentUser]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (!profileType) return;
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
    if (!profileType) return;
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

  const handleProfileTypeSelect = (type: UserType['type'], providerType?: ProfileSetupData['providerType']) => {
    setProfileType(type);
    setFormData(prev => ({...prev, providerType: providerType || 'professional'}));
  }

  const renderStep = () => {
    if (isLoading || !profileType) {
        return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    switch (currentStep) {
      case 1:
        return <Step1_ProfileType onSelect={handleProfileTypeSelect} currentType={profileType} onNext={handleNext} />;
      case 2:
        return <Step2_Username onBack={handleBack} onNext={handleNext} formData={formData} setFormData={setFormData} />;
      case 3:
        return <Step3_Category onBack={handleBack} onNext={handleNext} formData={formData} setFormData={setFormData} />;
      case 4:
        return <Step4_GeneralDetails onBack={handleBack} onNext={handleNext} formData={formData} setFormData={setFormData} />;
      case 5:
        return <Step5_SpecificDetails onBack={handleBack} onNext={handleNext} formData={formData} setFormData={setFormData} />;
      case 6:
        return <Step6_Review onBack={handleBack} formData={formData} setFormData={setFormData} profileType={profileType} goToStep={goToStep} />;
      default:
        return <Step1_ProfileType onSelect={handleProfileTypeSelect} currentType={profileType} onNext={handleNext} />;
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
