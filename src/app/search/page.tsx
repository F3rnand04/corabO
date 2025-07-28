
'use client';

import { CategoryHub } from '@/components/CategoryHub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
    const router = useRouter();

    const handleCategorySelect = () => {
        // This function can be used to close the search page/modal 
        // and navigate to the selected category results.
        // For now, it's just a placeholder.
    }

    return (
        <>
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container px-4 sm:px-6">
                    <div className="flex h-16 items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Busca un servicio o producto..." className="pl-10 rounded-full" />
                    </div>
                    </div>
                </div>
            </header>
            <main className="container py-4">
                <CategoryHub onCategorySelect={handleCategorySelect} />
            </main>
        </>
    );
}
