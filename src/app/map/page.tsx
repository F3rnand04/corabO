
'use client';

import { MapPageContent } from '@/components/MapPageContent';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MapPage() {
    const router = useRouter();

    return (
        <div className="relative h-screen w-screen">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-10 bg-background/80 rounded-full shadow-md hover:bg-background"
            >
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <MapPageContent />
        </div>
    );
}
