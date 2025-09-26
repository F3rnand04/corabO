'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-provider';
import type { ProfileSetupData } from '@/lib/types';
import InitialSetupForm from '@/components/profile-setup/InitialSetupForm';
import { Loader2 } from 'lucide-react';

export default function PersonalProviderSetupPage() {
  const { currentUser, firebaseUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // Although the form has its own state, we might need this for page-level logic

  if (!currentUser || !firebaseUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }

  const handleUpdateAndNext = (data: Partial<ProfileSetupData>) => {
    // This function will act as the `onSubmit` for the form.
    // It updates the central state and then moves to the next step.
    setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...(prev.profileSetupData || {}), ...data } } : null);
    router.push('/profile-setup/personal/details');
  };

  const userForForm = { 
      ...currentUser,
      uid: firebaseUser.uid, 
      emailVerified: firebaseUser.emailVerified 
  };

  return (
    <InitialSetupForm
        user={userForForm}
        onSubmit={handleUpdateAndNext}
        isSubmitting={isSubmitting}
    />
  );
}
