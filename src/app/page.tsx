
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { searchQuery, feedView, currentUser, getFeed } = useCorabo();
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);


  const loadFeed = useCallback(async (startAfterDocId?: string) => {
    if (isFetchingMore) return; // Prevent multiple fetches

    if (startAfterDocId) {
        setIsFetchingMore(true);
    } else {
        setIsLoading(true);
        setHasMore(true);
        setPublications([]);
    }

    try {
        const { publications: newPublications, lastVisibleDocId } = await getFeed({ limitNum: 5, startAfterDocId });
        
        setPublications(prev => startAfterDocId ? [...prev, ...newPublications] : newPublications);
        setLastVisible(lastVisibleDocId);

        if (!lastVisibleDocId || newPublications.length < 5) {
            setHasMore(false);
        }

    } catch (error) {
        console.error("Error fetching feed:", error);
    } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
    }
  }, [getFeed, isFetchingMore]);

  useEffect(() => {
    if (currentUser) {
        loadFeed(); // Initial load
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, feedView]); // Reload feed when view or user changes

  const filteredPublications = useMemo(() => {
    if (!publications.length) return [];
    
    let viewFiltered = publications.filter(item => {
        const providerType = item.owner?.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });
    
    if (!searchQuery) {
        return viewFiltered;
    }
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    return viewFiltered.filter(item => {
        const ownerNameMatch = item.owner?.name?.toLowerCase().includes(lowerCaseQuery);
        const specialtyMatch = item.owner?.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
        const publicationMatch = item.description.toLowerCase().includes(lowerCaseQuery);

        return ownerNameMatch || specialtyMatch || publicationMatch;
    });

  }, [publications, searchQuery, feedView]);

  const noResultsMessage = () => {
    const baseMessage = feedView === 'empresas' ? "No se encontraron empresas" : "No se encontraron publicaciones";
    if (searchQuery) {
        return `${baseMessage} para "${searchQuery}".`;
    }
    return `${baseMessage} en el feed.`;
  }

  if (isLoading || !currentUser) {
    return (
      <main className="container py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />)}
      </main>
    );
  }

  return (
    <main className="container py-4 space-y-4">
       {currentUser && !currentUser.isTransactionsActive && (
          <ActivationWarning userType={currentUser.type} />
      )}
       
        <div className="space-y-4">
        {filteredPublications.length > 0 ? (
            filteredPublications.map(item => <PublicationCard key={item.id} publication={item} />)
        ) : (
             !isFetchingMore && (
                <p className="text-center text-muted-foreground pt-16">
                    {noResultsMessage()}
                </p>
             )
        )}
        {hasMore && !isFetchingMore && filteredPublications.length > 0 && (
            <div className="flex justify-center">
                <Button onClick={() => loadFeed(lastVisible)} disabled={isFetchingMore}>
                    Cargar más
                </Button>
            </div>
        )}
        {isFetchingMore && (
            <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )}
        </div>
    </main>
  );
}
