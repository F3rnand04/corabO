
"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { ActivationWarning } from "@/components/ActivationWarning";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
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
  const { searchQuery, feedView, currentUser, getRankedFeed, fetchUser } = useCorabo();
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<(GalleryImage & { provider: User })[]>([]);

  useEffect(() => {
    const loadFeed = async () => {
        setIsLoading(true);
        const db = getFirestoreDb();
        // Securely fetch publications, e.g., limit to a reasonable number
        const q = query(collection(db, "publications"), limit(50));
        const querySnapshot = await getDocs(q);
        const publications = querySnapshot.docs.map(doc => doc.data() as GalleryImage);

        // Fetch provider for each publication
        const feedWithProviders = await Promise.all(
            publications.map(async (pub) => {
                const provider = await fetchUser(pub.providerId);
                // Return null or a placeholder if provider not found
                return provider ? { ...pub, provider } : null;
            })
        );
        
        // Filter out any nulls
        const validFeed = feedWithProviders.filter(item => item !== null) as (GalleryImage & { provider: User })[];
        setFeed(validFeed);
        setIsLoading(false);
    };

    if (currentUser) {
        loadFeed();
    }
  }, [currentUser, fetchUser]);


  const filteredFeed = useMemo(() => {
    if (!feed.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    // Filter by feed view first
    let viewFiltered = feed.filter(pub => {
        const providerType = pub.provider.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });

    if (!lowerCaseQuery) {
        return viewFiltered;
    }
    
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return viewFiltered.filter(pub => {
        const provider = pub.provider;
        if (!provider) return false;
        
        if (isCategorySearch) {
            const providerCategories = provider.profileSetupData?.categories || [];
            return providerCategories.some(cat => cat.toLowerCase() === lowerCaseQuery) || provider.profileSetupData?.primaryCategory?.toLowerCase() === lowerCaseQuery;
        } else {
            const publicationMatch = pub.description.toLowerCase().includes(lowerCaseQuery);
            const providerName = provider.profileSetupData?.useUsername 
                ? provider.profileSetupData.username 
                : provider.name;
            const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
            const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
            
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
          filteredFeed.map(pub => pub.provider ? <ProviderCard key={`${pub.provider.id}-${pub.id}`} provider={pub.provider} /> : null)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
          </p>
        )}
      </div>
    </main>
  );
}
