
"use client";

import { useMemo, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/types";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { PublicationCard } from "@/components/PublicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from "@/ai/flows/feed-flow";

export function FeedClientComponent() {
  const { currentUser, searchQuery, categoryFilter } = useCorabo();
  
  // This component now manages its own state for publications
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  useEffect(() => {
    // Fetch feed only when currentUser is available and loaded.
    if (currentUser) {
        setIsLoadingFeed(true);
        getFeed({ limitNum: 20 }) // Fetch initial batch
            .then(result => {
                if (result.publications) {
                    setPublications(result.publications as GalleryImage[]);
                }
            })
            .catch(error => {
                console.error("Failed to fetch feed:", error);
                setPublications([]); // Reset on error
            })
            .finally(() => {
                setIsLoadingFeed(false);
            });
    } else {
        // If there's no user, we show nothing or a loading state.
        // This is important for the initial anonymous load.
        setIsLoadingFeed(false);
        setPublications([]);
    }
  }, [currentUser]); // Dependency on currentUser ensures we fetch data only after login.
  
  const filteredPublications = useMemo(() => {
    let results = publications;

    if (categoryFilter) {
      results = results.filter(p => {
        const pCategory = p.productDetails?.category || p.owner?.profileSetupData?.primaryCategory;
        return pCategory === categoryFilter;
      });
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      results = results.filter(p => 
          p.description?.toLowerCase().includes(lowerCaseQuery) ||
          p.alt?.toLowerCase().includes(lowerCaseQuery) ||
          p.owner?.name.toLowerCase().includes(lowerCaseQuery) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(lowerCaseQuery))
      );
    }
    return results;
  }, [publications, searchQuery, categoryFilter]);


  const renderFeedContent = () => {
    if (isLoadingFeed) {
      return (
        <main className="space-y-4 container py-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full max-w-2xl mx-auto" />)}
        </main>
      );
    }

    if (filteredPublications.length > 0) {
      return (
        <div className="space-y-4">
          {filteredPublications.map((item, index) => (
              <PublicationCard key={item.id || index} publication={item} />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center text-muted-foreground pt-16">
        <p>No hay publicaciones para mostrar.</p>
        <p className="text-xs">Intenta cambiar tus filtros de búsqueda.</p>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <main className="space-y-4 container py-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full max-w-2xl mx-auto" />)}
      </main>
    );
  }

  return (
    <>
      {!currentUser.isTransactionsActive && (
        <div className="container py-4">
          <ActivationWarning userType={currentUser.type} />
        </div>
      )}
      {renderFeedContent()}
    </>
  );
}
