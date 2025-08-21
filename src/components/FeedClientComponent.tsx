
"use client";

import { useMemo, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/types";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { PublicationCard } from "@/components/PublicationCard";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedClientComponentProps {
  initialPublications: GalleryImage[];
}

export function FeedClientComponent({ initialPublications }: FeedClientComponentProps) {
  const { currentUser, searchQuery, categoryFilter } = useCorabo();
  // The component's state is initialized with the data passed from the server.
  // It is now the single source of truth for this component's data.
  const [publications, setPublications] = useState<GalleryImage[]>(initialPublications);
  
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


  if (!currentUser) {
     return (
      <main className="space-y-4 container py-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full max-w-2xl mx-auto" />)}
      </main>
    );
  }

  return (
    <>
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
              <p>No hay publicaciones que coincidan con tu búsqueda.</p>
            </div>
        )}
      </div>
    </>
  );
}
