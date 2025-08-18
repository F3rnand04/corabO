'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MapPageContent } from '@/components/MapPageContent';
import { Loader2 } from 'lucide-react';

// This is the server component wrapper for the map page.
// The onLocationConfirm prop is now passed down to handle closing the dialog.
export default function MapPage() {
    const router = useRouter();
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
            <MapPageContent onLocationConfirm={() => router.back()} />
        </Suspense>
    )
}
