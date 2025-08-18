
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MapPageContent } from '@/components/MapPageContent';
import { Loader2 } from 'lucide-react';

// This is the server component wrapper for the map page.
export default function MapPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
            <MapPageContent />
        </Suspense>
    )
}

    
