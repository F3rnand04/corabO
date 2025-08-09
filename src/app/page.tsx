
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
  const { searchQuery, feedView, currentUser, fetchUser, users } = useCorabo();
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<(GalleryImage & { provider: User })[]>([]);

  useEffect(() => {
    const loadFeed = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const db = getFirestoreDb();
            // This is the corrected, secure query. It fetches all users who are providers.
            // In a production app with many users, this would be further optimized with pagination
            // and more specific indexing, but for this stage, it's secure and functional.
            const providersQuery = query(collection(db, "users"), where("type", "==", "provider"), limit(25));
            const querySnapshot = await getDocs(providersQuery);
            
            const providers = querySnapshot.docs.map(doc => doc.data() as User);

            // Create a feed from the providers' galleries
            const newFeed = providers.flatMap(provider => 
                (provider.gallery || [])
                    .filter(pub => pub.type === 'image') // For now, only image publications in main feed
                    .map(publication => ({ ...publication, provider }))
            );
            
            // Sort by creation date to get the most recent ones first
            const sortedFeed = newFeed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setFeed(sortedFeed);
        } catch (error) {
            console.error("Error loading feed:", error);
            setFeed([]); // Ensure feed is empty on error
        } finally {
            setIsLoading(false);
        }
    };

    loadFeed();
  }, [currentUser]);


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
