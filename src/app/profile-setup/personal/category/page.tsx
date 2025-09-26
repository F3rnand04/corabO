
'use client';

import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { SpecializedFields } from '@/components/profile-setup/SpecializedFields';
import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';


export default function CategoryPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const onUpdate = (data: Partial<ProfileSetupData>) => {
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...prev.profileSetupData, ...data } } : null);
  };
  
  return (
    <SpecializedFields
      formData={currentUser.profileSetupData || {}} 
      onUpdate={onUpdate} 
    />
  );
}
