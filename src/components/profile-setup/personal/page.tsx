
'use client';

import Step1ProfileType from '@/components/profile-setup/personal/Step1_ProfileType';
import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function PersonalProviderSetupPage() {
  const { setCurrentUser } = useAuth();
  const router = useRouter();
  
  const handleUpdateAndNext = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
    router.push('/profile-setup/personal/category');
  };

  return <Step1ProfileType onUpdateAndNext={handleUpdateAndNext} />;
}
