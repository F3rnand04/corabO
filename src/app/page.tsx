
"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { ActivationWarning } from "@/components/ActivationWarning";
import { collection, getDocs, limit, query } from "firebase/firestore";
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
  const [feedData, setFeedData] = useState<(GalleryImage & { provider: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      const db = getFirestoreDb();
      const publicationsCol = collection(db, 'publications'); // Assuming a top-level publications collection
      const q = query(publicationsCol, limit(20)); // Get latest 20 publications
      
      try {
        const querySnapshot = await getDocs(q);
        const publications = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const pub = doc.data() as GalleryImage;
                const provider = await fetchUser(pub.providerId); // Fetch provider for each pub
                return provider ? { ...pub, provider } : null;
            })
        );
        
        setFeedData(publications.filter(p => p !== null) as (GalleryImage & { provider: User })[]);
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
    if (!feedData.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    // Filter by feed view first
    let viewFiltered = feedData.filter(pub => {
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

  }, [feedData, searchQuery, feedView]);

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
        {/* You can add a loading skeleton here */}
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

    