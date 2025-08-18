'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';

// This page now acts as a redirector to the default profile view.
export default function ProfilePage() {
    const router = useRouter();
    const { currentUser } = useCorabo();

    useEffect(() => {
        if (currentUser) {
            router.replace('/profile/publications');
        }
    }, [currentUser, router]);

    return (
        <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
