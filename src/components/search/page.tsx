
'use client';

import { CategoryHub } from '@/components/CategoryHub';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { ChevronLeft, List } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
    const router = useRouter();
    const { setSearchQuery, setCategoryFilter } = useAuth();

    const handleCategorySelect = (categoryName: string) => {
        // Neutralized: This no longer updates the feed.
        // In the future, this could navigate to a dedicated category page.
        // For now, it does nothing.
        console.log(`Category selected (neutralized): ${categoryName}`);
    }

    const handleShowAll = () => {
        setSearchQuery('');
        setCategoryFilter(null);
        router.push('/');
    }

    return (
        <>
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container px-4 sm:px-6">
                    <div className="flex h-16 items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <h2 className="text-xl font-bold">Explorar</h2>
                    </div>
                </div>
            </header>
            <main className="container py-4">
                <div className="mb-6">
                    <Button variant="outline" className="w-full" onClick={handleShowAll}>
                        <List className="mr-2 h-4 w-4" />
                        Ver Todo (Feed Principal)
                    </Button>
                </div>
                <CategoryHub onCategorySelect={handleCategorySelect} />
            </main>
        </>
    );
}
