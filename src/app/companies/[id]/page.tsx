'use client';

import { UserProfilePage } from '@/components/UserProfilePage';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CompanyProfileEntry() {
    const params = useParams();
    const userId = params?.id as string;

    if (!userId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return <UserProfilePage userId={userId} />;
}
