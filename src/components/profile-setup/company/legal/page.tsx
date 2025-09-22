
'use client';

import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import Step3_LegalInfo from '@/components/profile-setup/company/Step3_LegalInfo';
import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';

export default function LegalInfoPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }
  
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
