

"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User, GalleryImage } from "@/lib/types";
import { useMemo } from "react";

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
  const { getRankedFeed, searchQuery, feedView } = useCorabo();

  const rankedFeed = useMemo(() => getRankedFeed(), [getRankedFeed]);
  
  const filteredFeed = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    if (!lowerCaseQuery) {
        // Filter by feed view only
        return rankedFeed.filter(pub => {
            const providerType = pub.provider.profileSetupData?.providerType || 'professional';
            if (feedView === 'empresas') return providerType === 'company';
            return providerType !== 'company';
        });
    }

    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return rankedFeed.filter(pub => {
        const provider = pub.provider;
        const providerType = provider.profileSetupData?.providerType || 'professional';

        // Apply feed view filter first
        if (feedView === 'empresas' && providerType !== 'company') return false;
        if (feedView === 'servicios' && providerType === 'company') return false;

        // Then apply search query filter
        if (isCategorySearch) {
            return provider.profileSetupData?.categories?.some(cat => cat.toLowerCase() === lowerCaseQuery);
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

  }, [rankedFeed, searchQuery, feedView]);

  const noResultsMessage = () => {
    const baseMessage = feedView === 'empresas' ? "No se encontraron empresas" : "No se encontraron servicios";
    if (searchQuery) {
        return `${baseMessage} para "${searchQuery}".`;
    }
    return `${baseMessage} en el feed.`;
  }

  return (
    <main className="container py-4 space-y-6">
      <div className="space-y-4">
        {filteredFeed.length > 0 ? (
          filteredFeed.map(pub => <ProviderCard key={`${pub.provider.id}-${pub.id}`} provider={pub.provider} />)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {noResultsMessage()}
          </p>
        )}
      </div>
    </main>
  );
}
