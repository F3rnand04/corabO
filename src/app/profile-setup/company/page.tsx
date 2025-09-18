
'use client';

import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import Step1_CompanyInfo from '@/components/profile-setup/company/Step1_CompanyInfo';
import { useAuth } from '@/hooks/use-auth';

export default function CompanySetupPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();
  
  if (!currentUser) {
    // Debería ser manejado por un layout superior, pero como salvaguarda
    return null;
  }
  
  const handleUpdate = (data: Partial<ProfileSetupData>) => {
    if (currentUser) {
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          profileSetupData: {
            ...prevUser.profileSetupData,
            ...data
          }
        }
      });
    }
  };
  
  const handleNext = () => {
    router.push('/profile-setup/company/logistics');
  };

  return (
    <Step1_CompanyInfo 
      formData={currentUser.profileSetupData || {}}
      onUpdate={handleUpdate} 
      onNext={handleNext}
    />
  );
}
