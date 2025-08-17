
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import PublicationsPage from './publications/page';
import CatalogPage from './catalog/page';
import DetailsPage from './details/page';
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
    
    // The '/profile/publications' route is now the default handled by '/profile'
    // This logic correctly routes to the components based on the URL segment
    if (pathname === '/profile/catalog') {
        return <CatalogPage />;
    }
    if (pathname === '/profile/details') {
        return <DetailsPage />;
    }
    
    // Default to publications view if no other segment matches or if it's just '/profile'
    return <PublicationsPage />;
}
