

'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import PublicationsPage from './publications/page';
import CatalogPage from './catalog/page';
import DetailsPage from './details/page'; // Import the new details page
import { usePathname } from 'next/navigation';

export default function ProfilePage() {
    const { currentUser } = useCorabo();
    const pathname = usePathname();

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center pt-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (currentUser.type !== 'provider') {
        // For clients, or other types, maybe show a simplified view or redirect.
        // For now, let's assume they shouldn't access this complex profile view.
        return (
            <div className="flex items-center justify-center pt-20">
                <p>No tienes un perfil de proveedor para mostrar.</p>
            </div>
        );
    }

    // This component now acts as a router based on the URL.
    // The active tab is controlled by the URL itself.
    if (pathname.includes('/catalog')) {
        return <CatalogPage />;
    }
    if (pathname.includes('/details')) {
        return <DetailsPage />;
    }
    
    // Default to publications view
    return <PublicationsPage />;
}
