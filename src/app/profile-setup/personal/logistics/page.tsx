
'use client';

import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import Step4_Logistics from '@/components/profile-setup/personal/Step4_Logistics';
import { Loader2 } from 'lucide-react';


export default function LogisticsPage() {
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
      setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...(prev.profileSetupData || {}), ...data } } : null);
    };

    const handleNext = () => {
        router.push('/profile-setup/personal/legal');
    };

    return (
       <Step4_Logistics
            formData={currentUser.profileSetupData || {}}
            onUpdate={onUpdate}
            onNext={handleNext}
            isSubscribed={currentUser.isSubscribed || false}
       />
    );
}
