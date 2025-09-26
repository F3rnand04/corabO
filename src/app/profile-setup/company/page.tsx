'use client';

import type { ProfileSetupData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import InitialSetupForm from '@/components/profile-setup/InitialSetupForm';
import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { updateUser } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';

export default function CompanyInfoPage() {
  const { currentUser, firebaseUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || !firebaseUser) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const handleSubmit = async (data: Partial<ProfileSetupData>) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
        // 1. Update the user data locally and in the database
        const updatedProfileData = { ...currentUser.profileSetupData, ...data };
        setCurrentUser(prev => prev ? { ...prev, profileSetupData: updatedProfileData } : null);
        await updateUser(currentUser.id, { profileSetupData: updatedProfileData, isInitialSetupComplete: true });

        toast({ title: "Perfil actualizado", description: "Tu información ha sido guardada." });

        // 2. Navigate to the next step
        router.push('/'); // Redirect to home after completing initial setup

    } catch (error) {
        console.error("Failed to submit initial setup:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar tu información.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const userForForm = { 
      ...currentUser,
      uid: firebaseUser.uid, 
      emailVerified: firebaseUser.emailVerified 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <InitialSetupForm
            user={userForForm}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
        />
    </div>
  );
}
