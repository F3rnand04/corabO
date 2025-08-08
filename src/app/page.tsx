

"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ProviderCard } from "@/components/ProviderCard";
import type { User } from "@/lib/types";
import { useMemo } from "react";

export default function HomePage() {
  const { users, searchQuery, feedView } = useCorabo();

  const allProviders = useMemo(() => users.filter(u => u.type === 'provider' && !u.isPaused), [users]);

  const getFilteredProviders = () => {
     const lowerCaseQuery = searchQuery.toLowerCase();
     
     const filterLogic = (provider: User) => {
        const providerName = provider.profileSetupData?.useUsername 
            ? provider.profileSetupData.username 
            : provider.name;
            
        const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
        const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
        const categoryMatch = provider.profileSetupData?.categories?.some(cat => cat.toLowerCase().includes(lowerCaseQuery));

        return providerNameMatch || specialtyMatch || categoryMatch;
     }
     
     // Determine the target providers based on the current feed view
     const targetProviders = feedView === 'empresas' 
        ? allProviders.filter(p => p.profileSetupData?.providerType === 'company')
        : allProviders.filter(p => p.profileSetupData?.providerType !== 'company'); // 'servicios' are professionals/individuals
        
    if (lowerCaseQuery.trim() === '') {
        // Sort by GPS status when there is no search query
        return targetProviders.sort((a, b) => (b.isGpsActive ? 1 : 0) - (a.isGpsActive ? 1 : 0));
    }

    // Filter and then sort
    return targetProviders.filter(filterLogic).sort((a, b) => (b.isGpsActive ? 1 : 0) - (a.isGpsActive ? 1 : 0));
  }

  const filteredProviders = getFilteredProviders();
  const noResultsMessage = feedView === 'empresas' 
    ? "No se encontraron empresas." 
    : "No se encontraron servicios.";

  return (
    <main className="container py-4 space-y-6">
      <div className="space-y-4">
        {filteredProviders.length > 0 ? (
          filteredProviders.map(provider => <ProviderCard key={provider.id} provider={provider} />)
        ) : (
          <p className="text-center text-muted-foreground pt-16">
            {searchQuery ? `No se encontraron resultados para "${searchQuery}".` : noResultsMessage}
          </p>
        )}
      </div>
    </main>
  );
}
