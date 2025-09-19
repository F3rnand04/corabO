

'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, History, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';

function SearchHistoryHeader() {
  const router = useRouter();
  const { clearSearchHistory } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2"><History className="h-5 w-5"/> Historial</h1>
          <Button variant="ghost" size="icon" onClick={clearSearchHistory}>
            <Trash2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function SearchHistoryPage() {
    const { searchHistory, setSearchQuery } = useAuth();
    const router = useRouter();

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        router.push('/');
    }

  return (
    <>
      <SearchHistoryHeader />
      <main className="container max-w-4xl mx-auto py-8 space-y-4">
        {searchHistory.length > 0 ? (
            searchHistory.map((query, index) => (
                <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSearch(query)}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <p className="font-semibold">{query}</p>
                        <Search className="h-5 w-5 text-muted-foreground"/>
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No tienes búsquedas recientes.</p>
            </div>
        )}
      </main>
    </>
  );
}
