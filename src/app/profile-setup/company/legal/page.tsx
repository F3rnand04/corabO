
'use client';

import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import Step3_LegalInfo from '@/components/profile-setup/company/Step3_LegalInfo';
import { useAuth } from '@/hooks/use-auth-provider';

export default function LegalInfoPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) return null;
  
  const handleUpdate = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
  };
  
  const handleNext = () => {
    router.push('/profile-setup/company/review');
  };

  return (
    <Step3_LegalInfo 
      formData={currentUser.profileSetupData || {}} 
      onUpdate={handleUpdate} 
      onNext={handleNext} 
    />
  );
}
