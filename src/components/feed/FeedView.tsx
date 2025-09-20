
'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import type { GalleryImage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import { ActivationWarning } from '@/components/ActivationWarning';
import { PublicationCard } from '@/components/PublicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getFeed } from '@/lib/actions/feed.actions';

export function FeedView() {
  const { currentUser, searchQuery, categoryFilter, isLoadingAuth } = useAuth();
  
  // Local state for feed data, now managed by this component
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [lastVisibleDocId, setLastVisibleDocId] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver>();

  const loadMorePublications = useCallback(async () => {
    if (!hasMore || isLoadingFeed) return;
    setIsLoadingFeed(true);
    try {
      const result = await getFeed({ 
        limitNum: 5, 
        startAfterDocId: lastVisibleDocId,
        searchQuery: searchQuery || undefined,
        categoryFilter: categoryFilter || undefined,
      });
      setPublications(prev => [...prev, ...result.publications]);
      setLastVisibleDocId(result.lastVisibleDocId);
      setHasMore(!!result.lastVisibleDocId);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [hasMore, isLoadingFeed, lastVisibleDocId, searchQuery, categoryFilter]);


  useEffect(() => {
    // Reset and fetch new data when filters change
    setPublications([]);
    setLastVisibleDocId(undefined);
    setHasMore(true);
    // The `loadMorePublications` will be triggered by the observer setup below
    // if `hasMore` is true. We can kick off the initial load here.
    const initialLoad = async () => {
      setIsLoadingFeed(true);
       try {
        const result = await getFeed({ 
          limitNum: 5,
          searchQuery: searchQuery || undefined,
          categoryFilter: categoryFilter || undefined,
        });
        setPublications(result.publications);
        setLastVisibleDocId(result.lastVisibleDocId);
        setHasMore(!!result.lastVisibleDocId);
      } catch (error) {
        console.error("Failed to fetch initial feed:", error);
      } finally {
        setIsLoadingFeed(false);
      }
    }
    initialLoad();
  }, [searchQuery, categoryFilter]);


  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingFeed) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePublications();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingFeed, hasMore, loadMorePublications]);


  const renderFeedContent = () => {
    // Initial loading state
    if (isLoadingFeed && publications.length === 0) {
      return (
        <div className="space-y-4 container mx-auto max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[500px] w-full" />
          ))}
        </div>
      );
    }
    
    // No results found
    if (publications.length === 0) {
      return (
        <div className="text-center text-muted-foreground pt-16">
          <p>No se encontraron publicaciones.</p>
          <p className="text-xs">Intenta cambiar tus filtros de búsqueda.</p>
        </div>
      );
    }

    // Display publications
    return (
      <div className="space-y-4 container mx-auto max-w-2xl">
        {publications.map((item, index) => {
          const isLastElement = index === publications.length - 1;
          return (
             <div ref={isLastElement ? lastElementRef : null} key={item.id || index}>
                 <PublicationCard publication={item} />
             </div>
          );
        })}
         {isLoadingFeed && (
            <div className="flex justify-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
         )}
      </div>
    );
  };
  
  // This loader is for the initial page authentication
  if (isLoadingAuth) {
    return (
      <main className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

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
