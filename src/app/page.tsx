
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage, PublicationOwner } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// The owner data is now embedded in the publication object
interface PublicationWithOwner extends GalleryImage {
    owner: PublicationOwner
}

export default function HomePage() {
  const { searchQuery, feedView, currentUser, getFeed } = useCorabo();
  const [publications, setPublications] = useState<PublicationWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);


  const loadFeed = useCallback(async (startAfterDocId?: string) => {
    if (startAfterDocId) {
        setIsFetchingMore(true);
    } else {
        setIsLoading(true);
    }

    try {
        const { publications: newPublications, lastVisibleDocId } = await getFeed({ limitNum: 5, startAfterDocId });
        const sanitizedData = newPublications.map(p => ({ ...p, owner: p.owner || {} })) as PublicationWithOwner[];

        setPublications(prev => startAfterDocId ? [...prev, ...sanitizedData] : sanitizedData);
        setLastVisible(lastVisibleDocId);

        if (!lastVisibleDocId || newPublications.length === 0) {
            setHasMore(false);
        }

    } catch (error) {
        console.error("Error fetching feed:", error);
    } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
    }
  }, [getFeed]);

  useEffect(() => {
    if (currentUser) {
        setHasMore(true);
        loadFeed();
    }
  }, [currentUser, feedView]); // Reload feed when view changes

  const filteredPublications = useMemo(() => {
    if (!publications.length) return [];
    
    let viewFiltered = publications.filter(item => {
        // Fallback for items that might not have owner or profileSetupData
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
            <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
            </p>
        )}
        {hasMore && filteredPublications.length > 0 && (
            <div className="flex justify-center">
                <Button onClick={() => loadFeed(lastVisible)} disabled={isFetchingMore}>
                    {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Cargar más
                </Button>
            </div>
        )}
        </div>
    </main>
  );
}
