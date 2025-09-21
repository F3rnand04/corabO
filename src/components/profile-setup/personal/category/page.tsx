'use client';

import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Step3Category from '@/components/profile-setup/personal/Step3_Category';
import { useAuth } from '@/hooks/use-auth-provider';


export default function CategoryPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) return null;

  const onUpdate = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
  };
  
  const handleNext = () => {
    router.push('/profile-setup/personal/logistics');
  };

  return (
    <Step3Category
      formData={currentUser.profileSetupData || {}} 
      onUpdate={onUpdate} 
      onNext={handleNext} 
    />
  );
}
