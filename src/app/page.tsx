
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const { currentUser, getFeed, searchQuery, setSearchQuery, categoryFilter } = useCorabo();
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  
  const loadFeed = useCallback(async (startAfterDocId?: string, isInitialLoad = false) => {
    if (isFetchingMore && !isInitialLoad) return; 

    if (isInitialLoad) {
        setIsLoading(true);
        setHasMore(true); 
        setPublications([]); 
    } else {
        setIsFetchingMore(true);
    }

    try {
        const { publications: newPublications, lastVisibleDocId } = await getFeed({ limitNum: 5, startAfterDocId });
        
        setPublications(prev => isInitialLoad ? newPublications : [...prev, ...newPublications]);
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

  const lastElementRef = useCallback(node => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
            loadFeed(lastVisible);
        }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore, loadFeed, lastVisible]);


  useEffect(() => {
    if (currentUser) {
        loadFeed(undefined, true); // Initial load
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); 

  const filteredPublications = useMemo(() => {
    let results = publications;

    // 1. Filter by category
    if (categoryFilter) {
      results = results.filter(p => {
        // Check both product category and provider's primary category
        if (p.type === 'product' && p.productDetails?.category) {
          return p.productDetails.category === categoryFilter;
        }
        if (p.owner?.profileSetupData?.primaryCategory) {
          return p.owner.profileSetupData.primaryCategory === categoryFilter;
        }
        return false;
      });
    }

    // 2. Filter by search query
    if (searchQuery) {
      results = results.filter(p => 
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.profileSetupData?.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return results;
  }, [publications, searchQuery, categoryFilter]);


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
            filteredPublications.map((item, index) => {
                // The ref for infinite scroll is attached to the last item of the *unfiltered* list
                if(publications.length === index + 1) {
                    return <div ref={lastElementRef} key={item.id}><PublicationCard publication={item} /></div>
                }
                return <PublicationCard key={item.id} publication={item} />
            })
        ) : (
             !isFetchingMore && (
                <p className="text-center text-muted-foreground pt-16">
                    No se encontraron publicaciones.
                </p>
             )
        )}
        {isFetchingMore && (
            <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )}
        </div>
    </main>
  );
}
