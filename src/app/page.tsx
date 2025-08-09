
"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { PublicationCard } from "@/components/PublicationCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { getFirestoreDb } from "@/lib/firebase";

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
  const { searchQuery, feedView, currentUser } = useCorabo();
  const [providers, setProviders] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProviders = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const db = getFirestoreDb();
      
      const providersQuery = query(
        collection(db, "users"), 
        where("type", "==", "provider"),
        where("isTransactionsActive", "==", true)
      );

      try {
        const querySnapshot = await getDocs(providersQuery);
        const providerList = querySnapshot.docs.map(doc => doc.data() as User);
        // Sort on the client side to avoid complex indexes
        const sortedProviders = providerList.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
        setProviders(sortedProviders);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
        fetchProviders();
    }
  }, [currentUser]);

  const feedItems = useMemo(() => {
    return providers.flatMap(p => (p.gallery || []).map(g => ({ ...p, galleryItem: g })) )
            .sort((a, b) => new Date(b.galleryItem.createdAt).getTime() - new Date(a.galleryItem.createdAt).getTime());
  }, [providers]);


  const filteredFeed = useMemo(() => {
    if (!feedItems.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    let viewFiltered = feedItems.filter(item => {
        const providerType = item.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });

    if (!lowerCaseQuery) {
        return viewFiltered;
    }
    
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return viewFiltered.filter(item => {
        if (!item) return false;
        
        if (isCategorySearch) {
            const providerCategories = item.profileSetupData?.categories || [];
            return providerCategories.some(cat => cat.toLowerCase() === lowerCaseQuery) || item.profileSetupData?.primaryCategory?.toLowerCase() === lowerCaseQuery;
        } else {
            const providerName = item.profileSetupData?.useUsername 
                ? item.profileSetupData.username 
                : item.name;
            const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
            const specialtyMatch = item.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
            const publicationMatch = item.galleryItem.description.toLowerCase().includes(lowerCaseQuery);

            return publicationMatch || providerNameMatch || specialtyMatch;
        }
    });

  }, [feedItems, searchQuery, feedView]);

  const noResultsMessage = () => {
    const baseMessage = feedView === 'empresas' ? "No se encontraron empresas" : "No se encontraron servicios";
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
        {filteredFeed.length > 0 ? (
          filteredFeed.map(item => <PublicationCard key={item.galleryItem.id} publication={item.galleryItem} owner={item} />)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
          </p>
        )}
      </div>
    </main>
  );
}

    