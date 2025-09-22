'use client';

import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import Step2_Details from '@/components/profile-setup/personal/Step2_Details';

export default function DetailsPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) return null;

  const onUpdate = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
  };
  
  const handleNext = () => {
    router.push('/profile-setup/personal/category');
  };

  return (
    <Step2_Details
      formData={currentUser.profileSetupData || {}} 
      onUpdate={onUpdate} 
      onNext={handleNext} 
    />
  );
}
