
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
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
  const { searchQuery, feedView, currentUser, users } = useCorabo();
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser) return;

    const db = getFirestoreDb();
    const publicationsQuery = query(
        collection(db, "publications"),
        orderBy("createdAt", "desc"),
        limit(50)
    );

    const unsubscribe = onSnapshot(publicationsQuery, (querySnapshot) => {
        const publicationsData = querySnapshot.docs.map(doc => doc.data() as GalleryImage);
        setPublications(publicationsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching publications in real-time:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const feedItems = useMemo(() => {
    if (!publications.length || !users.length) return [];
    
    return publications.map(pub => {
        const owner = users.find(u => u.id === pub.providerId);
        return owner ? { publication: pub, owner } : null;
    }).filter((item): item is { publication: GalleryImage; owner: User } => item !== null);

  }, [publications, users]);


  const filteredFeed = useMemo(() => {
    if (!feedItems.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    let viewFiltered = feedItems.filter(item => {
        const providerType = item.owner.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });

    if (!lowerCaseQuery) {
        return viewFiltered;
    }
    
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return viewFiltered.filter(item => {
        if (!item || !item.owner) return false;
        
        if (isCategorySearch) {
            const providerCategories = item.owner.profileSetupData?.categories || [];
            return providerCategories.some(cat => cat.toLowerCase() === lowerCaseQuery) || item.owner.profileSetupData?.primaryCategory?.toLowerCase() === lowerCaseQuery;
        } else {
            const providerName = item.owner.profileSetupData?.useUsername 
                ? item.owner.profileSetupData.username 
                : item.owner.name;
            const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
            const specialtyMatch = item.owner.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
            const publicationMatch = item.publication.description.toLowerCase().includes(lowerCaseQuery);

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

  if (!currentUser) {
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
       {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />)}
          </div>
        ) : (
            <div className="space-y-4">
            {filteredFeed.length > 0 ? (
              filteredFeed.map(item => <PublicationCard key={item.publication.id} publication={item.publication} owner={item.owner} />)
            ) : (
              <p className="text-center text-muted-foreground pt-16">
                {noResultsMessage()}
              </p>
            )}
            </div>
        )}
    </main>
  );
}
