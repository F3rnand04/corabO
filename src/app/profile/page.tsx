

'use client';

import { useAuth } from '@/hooks/use-auth-provider';
import { Loader2 } from 'lucide-react';
import { UserProfilePage } from '@/components/UserProfilePage';

export default function ProfilePage() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return <UserProfilePage userId={currentUser.id} />;
}
