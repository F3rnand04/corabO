'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { currentUser } = useCorabo();
    const router = useRouter();

    useEffect(() => {
        if (currentUser) {
            // Redirect to the appropriate default view based on offer type.
            const defaultView = currentUser.profileSetupData?.offerType === 'product' ? 'catalog' : 'publications';
            router.replace(`/profile/${defaultView}`);
        }
    }, [currentUser, router]);

    // Render a loader while redirecting
    return (
        <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
