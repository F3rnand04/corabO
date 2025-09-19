
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoginPage from './login/page';
import InitialSetupPage from './initial-setup/page';
import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from './AppLayout';
import { Loader2 } from 'lucide-react';

interface MainPageProps {
    serverUser: import('@/lib/types').User | null;
}

export function MainPage({ serverUser }: MainPageProps) {
    const { currentUser, setCurrentUser, isLoadingAuth } = useAuth();
    
    // Sync the server-fetched user with the client-side context
    useEffect(() => {
        setCurrentUser(serverUser);
    }, [serverUser, setCurrentUser]);

    if (isLoadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginPage />;
    }

    if (!currentUser.isInitialSetupComplete) {
        return <InitialSetupPage />;
    }

    return (
        <AppLayout>
            <FeedClientComponent />
        </AppLayout>
    );
}
