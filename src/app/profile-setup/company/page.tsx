'use client';

import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Step1_CompanyInfo from '@/components/profile-setup/company/Step1_CompanyInfo';
import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';

export default function CompanyInfoPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const onUpdate = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
  };

  const handleNext = () => {
    router.push('/profile-setup/company/logistics');
  };

  return (
    <Step1_CompanyInfo
      formData={currentUser.profileSetupData || {}}
      onUpdate={onUpdate}
      onNext={handleNext}
    />
  );
}
