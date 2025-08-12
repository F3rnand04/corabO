
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
import { getFeed } from "@/ai/flows/feed-flow";

export default function HomePage() {
  const { currentUser, searchQuery, categoryFilter } = useCorabo();
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisibleDocId, setLastVisibleDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchPublications = useCallback(async (cursorId: string | null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await getFeed({ limitNum: 5, startAfterDocId: cursorId ?? undefined });
      setPublications(prev => cursorId ? [...prev, ...result.publications] : result.publications);
      setLastVisibleDocId(result.lastVisibleDocId);
      setHasMore(result.publications.length > 0 && !!result.lastVisibleDocId);
    } catch (error) {
      console.error("Failed to fetch publications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Initial fetch
    fetchPublications(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchPublications(lastVisibleDocId);
        }
      },
      { threshold: 1.0 }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, isLoading, lastVisibleDocId, fetchPublications]);
  
  const filteredPublications = useMemo(() => {
    let results = publications;

    if (categoryFilter) {
      results = results.filter(p => {
        const pCategory = p.productDetails?.category || p.owner?.profileSetupData?.primaryCategory;
        return pCategory === categoryFilter;
      });
    }

    if (searchQuery) {
      results = results.filter(p => 
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.profileSetupData?.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return results;
  }, [publications, searchQuery, categoryFilter]);


  if (!currentUser) {
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
              filteredPublications.map((item, index) => (
                  <PublicationCard key={item.id || index} publication={item} />
              ))
          ) : isLoading ? (
               Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />)
          ) : (
              <div className="text-center text-muted-foreground pt-16">
                <p>No hay publicaciones para mostrar en este momento.</p>
              </div>
          )}
        </div>
        
        <div ref={loaderRef} className="flex justify-center py-4">
          {isLoading && publications.length > 0 && <Loader2 className="h-8 w-8 animate-spin text-primary"/>}
          {!hasMore && publications.length > 0 && (
            <p className="text-sm text-muted-foreground">Has llegado al final.</p>
          )}
        </div>
    </main>
  );
}
