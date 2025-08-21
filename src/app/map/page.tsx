'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPageContent = dynamic(() => import('@/components/MapPageContent').then(mod => mod.MapPageContent), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>
});


function MapPageWrapper() {
    return (
        <div className="h-screen w-screen">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
                <MapPageContent />
            </Suspense>
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
