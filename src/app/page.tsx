
"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { ActivationWarning } from "@/components/ActivationWarning";
import { collection, getDocs, limit, query, where, orderBy } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const mainCategories = [
  'Hogar y Reparaciones', 
  'Tecnología y Soporte', 
  'Automotriz y Repuestos', 
  'Alimentos y Restaurantes', 
  'Salud y Bienestar', 
  'Educación', 
  'Eventos', 
  'Belleza', 
  'Fletes y Delivery'
];

export default function HomePage() {
  const { searchQuery, feedView, currentUser, fetchUser } = useCorabo();
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<(User & { galleryItem: GalleryImage })[]>([]);

  useEffect(() => {
    const fetchFeed = async () => {
        setIsLoading(true);
        const db = getFirestoreDb();
        const galleryQuery = query(
            collection(db, "gallery"), 
            orderBy("createdAt", "desc"), 
            limit(50)
        );

        try {
            const querySnapshot = await getDocs(galleryQuery);
            const feedItems = await Promise.all(
                querySnapshot.docs.map(async (doc) => {
                    const galleryItem = doc.data() as GalleryImage;
                    const provider = await fetchUser(galleryItem.providerId);
                    if (provider) {
                        return { ...provider, galleryItem };
                    }
                    return null;
                })
            );
            
            // Filter out nulls and potentially shuffle/rank here
            setFeed(feedItems.filter(item => item !== null) as (User & { galleryItem: GalleryImage })[]);

        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (currentUser) {
        fetchFeed();
    }
  }, [currentUser, fetchUser]);

  const filteredFeed = useMemo(() => {
    if (!feed.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    // Filter by feed view first
    let viewFiltered = feed.filter(provider => {
        const providerType = provider.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });

    if (!lowerCaseQuery) {
        return viewFiltered;
    }
    
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return viewFiltered.filter(provider => {
        if (!provider) return false;
        
        if (isCategorySearch) {
            const providerCategories = provider.profileSetupData?.categories || [];
            return providerCategories.some(cat => cat.toLowerCase() === lowerCaseQuery) || provider.profileSetupData?.primaryCategory?.toLowerCase() === lowerCaseQuery;
        } else {
            const providerName = provider.profileSetupData?.useUsername 
                ? provider.profileSetupData.username 
                : provider.name;
            const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
            const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
            // Search in the specific gallery item description shown in the feed
            const publicationMatch = provider.galleryItem.description.toLowerCase().includes(lowerCaseQuery);

            return publicationMatch || providerNameMatch || specialtyMatch;
        }
    });

  }, [feed, searchQuery, feedView]);

  const noResultsMessage = () => {
    const baseMessage = feedView === 'empresas' ? "No se encontraron empresas" : "No se encontraron servicios";
    if (searchQuery) {
        return `${baseMessage} para "${searchQuery}".`;
    }
    return `${baseMessage} en el feed.`;
  }

  if (!currentUser) {
    return (
      <main className="container py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)}
      </main>
    );
  }

  return (
    <main className="container py-4 space-y-4">
       {currentUser && !currentUser.isTransactionsActive && (
          <ActivationWarning userType={currentUser.type} />
      )}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)
        ) : filteredFeed.length > 0 ? (
          filteredFeed.map(provider => <ProviderCard key={provider.galleryItem.id} provider={provider} />)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
          </p>
        )}
      </div>
    </main>
  );
}
