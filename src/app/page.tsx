

"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";

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
  const { users, searchQuery, feedView } = useCorabo();
  const [allPublications, setAllPublications] = useState<(GalleryImage & { provider: User })[]>([]);

  useEffect(() => {
    const publications = users
      .filter(u => u.type === 'provider')
      .flatMap(p => (p.gallery || []).map(g => ({ ...g, provider: p })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setAllPublications(publications);
  }, [users]);


  const getFilteredPublications = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    // Determine if the search query is one of the main categories
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    const filterLogic = (publication: (GalleryImage & { provider: User })) => {
      const provider = publication.provider;
      
      if (isCategorySearch) {
        // Strict category filtering
        return provider.profileSetupData?.categories?.some(cat => cat.toLowerCase() === lowerCaseQuery);
      } else {
        // General text search
        const publicationMatch = publication.description.toLowerCase().includes(lowerCaseQuery);
        const providerName = provider.profileSetupData?.useUsername 
            ? provider.profileSetupData.username 
            : provider.name;
        const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
        const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
        const categoryKeywordMatch = provider.profileSetupData?.categories?.some(cat => cat.toLowerCase().includes(lowerCaseQuery));

        return publicationMatch || providerNameMatch || specialtyMatch || categoryKeywordMatch;
      }
    }
     
     // Determine the target publications based on the current feed view (servicios vs empresas)
     const targetPublications = allPublications.filter(p => {
        const providerType = p.provider.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') {
            return providerType === 'company';
        }
        return providerType !== 'company'; // 'servicios' are professionals/individuals
     });
        
    if (lowerCaseQuery.trim() === '') {
        return targetPublications;
    }

    return targetPublications.filter(filterLogic);
  }

  const filteredPublications = getFilteredPublications();

  const noResultsMessage = () => {
    const baseMessage = feedView === 'empresas' ? "No se encontraron empresas" : "No se encontraron servicios";
    if (searchQuery) {
        return `${baseMessage} para "${searchQuery}".`;
    }
    return `${baseMessage}.`;
  }

  return (
    <main className="container py-4 space-y-6">
      <div className="space-y-4">
        {filteredPublications.length > 0 ? (
          filteredPublications.map(pub => <ProviderCard key={pub.id} publication={pub} />)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
          </p>
        )}
      </div>
    </main>
  );
}
