'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-provider';
import type { ProfileSetupData } from '@/lib/types';
import Step1_ProfileType from '@/components/profile-setup/personal/Step1_ProfileType';
import { Loader2 } from 'lucide-react';


export default function PersonalProviderSetupPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }

  const handleUpdateAndNext = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
    router.push('/profile-setup/personal/details');
  };

  return <Step1_ProfileType onUpdateAndNext={handleUpdateAndNext} />;
}
