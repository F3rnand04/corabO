
'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import type { GalleryImage } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { ActivationWarning } from "@/components/ActivationWarning";
import { PublicationCard } from "@/components/PublicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from '@/lib/actions/feed.actions';
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import Image from "next/image";

export function FeedClientComponent() {
  const { currentUser, isLoadingAuth, searchQuery, categoryFilter } = useAuth();
  
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [lastVisibleDocId, setLastVisibleDocId] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMorePublications = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoadingFeed) return;

    setIsLoadingMore(true);
    try {
        const result = await getFeed({ limitNum: 5, startAfterDocId: lastVisibleDocId });
        if (result.publications && result.publications.length > 0) {
            setPublications(prev => [...prev, ...result.publications as GalleryImage[]]);
            setLastVisibleDocId(result.lastVisibleDocId);
            setHasMore(!!result.lastVisibleDocId);
        } else {
            setHasMore(false);
        }
    } catch (error) {
        console.error("Failed to fetch more feed:", error);
    } finally {
        setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isLoadingFeed, lastVisibleDocId]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore || isLoadingFeed) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePublications();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, isLoadingFeed, hasMore, loadMorePublications]);


  useEffect(() => {
    // This effect handles the INITIAL loading of the feed.
    setIsLoadingFeed(true);
    setPublications([]);
    setLastVisibleDocId(undefined);
    setHasMore(true);

    getFeed({ limitNum: 5 })
        .then(result => {
            if (result.publications) {
                setPublications(result.publications as GalleryImage[]);
                setLastVisibleDocId(result.lastVisibleDocId);
                setHasMore(!!result.lastVisibleDocId);
            }
        })
        .catch(error => {
            console.error("Failed to fetch feed:", error);
            setPublications([]);
        })
        .finally(() => {
            setIsLoadingFeed(false);
        });
  }, []);
  
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
    if (filteredPublications.length > 0) {
      return (
        <div className="space-y-4 container mx-auto max-w-2xl">
          {filteredPublications.map((item, index) => {
            if (index === filteredPublications.length - 1) {
              return <div ref={lastElementRef} key={item.id || index}><PublicationCard publication={item} /></div>
            }
            return <PublicationCard key={item.id || index} publication={item} />
          })}
          {isLoadingMore && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
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

  if (isLoadingAuth || isLoadingFeed) {
    return (
      <main className="space-y-4 container py-4 mx-auto max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full" />)}
      </main>
    );
  }

  // AppLayout now handles the unauthenticated state.
  // This component will only render if there is a currentUser.
  return (
    <>
      <div className="container py-4 mx-auto max-w-2xl">
        {currentUser && !currentUser.isTransactionsActive && (
          <ActivationWarning userType={currentUser.type} />
        )}
      </div>
      {renderFeedContent()}
    </>
  );
}
