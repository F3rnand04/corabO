'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MapPageContent } from '@/components/MapPageContent';
import { Loader2 } from 'lucide-react';

export default function MapPage() {
    const router = useRouter();
    return (
        <div className="h-screen w-screen">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
                <MapPageContent />
            </Suspense>
        </div>
    )
}
