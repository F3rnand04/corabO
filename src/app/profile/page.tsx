
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import PublicationsPage from './publications/page';
import CatalogPage from './catalog/page';

export default function ProfilePage() {
    const { currentUser } = useCorabo();

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center pt-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Si no es un proveedor, no tiene una vista de perfil pública de este tipo.
    // Aunque AppLayout debería prevenirlo, es una salvaguarda.
    if (currentUser.type !== 'provider') {
        return (
            <div className="flex items-center justify-center pt-20">
                <p>No tienes un perfil de proveedor para mostrar.</p>
            </div>
        );
    }

    // Determinar la vista por defecto y renderizarla directamente.
    // Esto elimina la necesidad de una redirección que causaba bucles.
    const isProductView = currentUser.profileSetupData?.offerType === 'product';

    if (isProductView) {
        return <CatalogPage />;
    } else {
        return <PublicationsPage />;
    }
}
