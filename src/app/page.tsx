
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import * as Actions from '@/lib/actions';


export default function HomePage() {
  const { currentUser, searchQuery, categoryFilter, isLoadingAuth } = useCorabo();
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  
  useEffect(() => {
    const fetchInitialFeed = async () => {
        setIsLoadingFeed(true);
        try {
            const initialFeed = await Actions.getFeed({limitNum: 10});
            setAllPublications(initialFeed.publications);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setIsLoadingFeed(false);
        }
    };
    fetchInitialFeed();
  }, [])
  
  const filteredPublications = useMemo(() => {
    let results = allPublications;

    if (categoryFilter) {
      results = results.filter(p => {
        const pCategory = p.productDetails?.category || p.owner?.profileSetupData?.primaryCategory;
        return pCategory === categoryFilter;
      });
    }

    if (searchQuery) {
      results = results.filter(p => 
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return results;
  }, [allPublications, searchQuery, categoryFilter]);


  if (isLoadingAuth && isLoadingFeed) {
    return (
      <main className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full" />)}
      </main>
    );
  }

  if (!currentUser) return null; // Should be handled by AppLayout, but good practice

  return (
    <main className="space-y-4">
       {currentUser && !currentUser.isTransactionsActive && (
          <div className="container py-4">
            <ActivationWarning userType={currentUser.type} />
          </div>
      )}
       
        <div className="space-y-4">
          {filteredPublications.length > 0 ? (
              filteredPublications.map((item, index) => (
                  <PublicationCard key={item.id || index} publication={item} />
              ))
          ) : (
              <div className="text-center text-muted-foreground pt-16">
                <p>No hay publicaciones para mostrar en este momento.</p>
              </div>
          )}
        </div>
    </main>
  );
}
