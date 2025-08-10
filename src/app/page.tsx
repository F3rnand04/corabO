
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage, PublicationOwner } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";

// The owner data is now embedded in the publication object
interface PublicationWithOwner extends GalleryImage {
    owner: PublicationOwner
}

export default function HomePage() {
  const { searchQuery, feedView, currentUser, getFeed } = useCorabo();
  const [publications, setPublications] = useState<PublicationWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This effect fetches the feed once when the component mounts if the user is available.
  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
        const feedData = await getFeed();
        // Ensure owner data is at least an empty object to prevent render errors
        const sanitizedData = feedData.map(p => ({ ...p, owner: p.owner || {} })) as PublicationWithOwner[];
        
        // CRITICAL FIX: Sort publications on the client-side after fetching
        const sortedData = sanitizedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setPublications(sortedData);
    } catch (error) {
        console.error("Error fetching feed:", error);
    } finally {
        setIsLoading(false);
    }
  }, [getFeed]);

  useEffect(() => {
    if (currentUser) {
        loadFeed();
    }
  }, [currentUser, loadFeed]);

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
        </div>
    </main>
  );
}
