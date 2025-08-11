
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { currentUser, getFeed } = useCorabo();
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
        {publications.length > 0 ? (
            publications.map((item, index) => {
                if(publications.length === index + 1) {
                    return <div ref={lastElementRef} key={item.id}><PublicationCard publication={item} /></div>
                }
                return <PublicationCard key={item.id} publication={item} />
            })
        ) : (
             !isFetchingMore && (
                <p className="text-center text-muted-foreground pt-16">
                    No se encontraron publicaciones en el feed.
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
