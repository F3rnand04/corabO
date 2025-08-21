
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
  const { currentUser, searchQuery, categoryFilter, users } = useCorabo();
  // Initialize state with the data passed from the server
  const [publications, setPublications] = useState<GalleryImage[]>(initialPublications);
  const [isLoading, setIsLoading] = useState(false); // Only for subsequent loads

  useEffect(() => {
    // This could be used for infinite scroll in the future
  }, [currentUser]);

  const filteredPublications = useMemo(() => {
    let results = publications.map(p => {
        const owner = users.find(u => u.id === p.providerId);
        return { ...p, owner };
    });

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
          p.owner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return results;
  }, [publications, searchQuery, categoryFilter, users]);


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
              <p>No hay publicaciones para mostrar en este momento.</p>
            </div>
        )}
      </div>
    </>
  );
}
