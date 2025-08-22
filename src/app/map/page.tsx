'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
// import dynamic from 'next/dynamic';

// const MapPageContent = dynamic(() => import('@/components/MapPageContent').then(mod => mod.MapPageContent), {
//     ssr: false,
//     loading: () => <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>
// });

// Temporarily disabled for diagnostics
function MapPageWrapper() {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            <p className="ml-4">Mapa en diagnóstico...</p>
        </div>
    )
}

export default function MapPage() {
    return (
        <Suspense>
            <MapPageWrapper />
        </Suspense>
    )
}
