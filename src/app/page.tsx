
"use client";

import { ProviderCard } from "@/components/provider-card";
import type { User } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { getFeed } from "@/ai/flows/feed-flow";

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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
        setIsLoading(true);
        // This flow runs on the server and is allowed to fetch all users.
        const feedUsers = await getFeed();
        setUsers(feedUsers.map(item => item.owner));
        setIsLoading(false);
    };
    loadFeed();
  }, []);

  const filteredProviders = useMemo(() => {
    if (!users.length) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    let viewFiltered = users.filter(provider => {
        const providerType = provider.profileSetupData?.providerType || 'professional';
        if (feedView === 'empresas') return providerType === 'company';
        return providerType !== 'company';
    });

    if (!lowerCaseQuery) {
        return viewFiltered;
    }
    
    const isCategorySearch = mainCategories.some(cat => cat.toLowerCase() === lowerCaseQuery);

    return viewFiltered.filter(provider => {
        if (isCategorySearch) {
            const providerCategories = provider.profileSetupData?.categories || [];
            return providerCategories.some(cat => cat.toLowerCase() === lowerCaseQuery) || provider.profileSetupData?.primaryCategory?.toLowerCase() === lowerCaseQuery;
        } else {
            const providerName = provider.profileSetupData?.useUsername 
                ? provider.profileSetupData.username 
                : provider.name;
            const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
            const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);
            // Additionally search in publications description
            const publicationMatch = provider.gallery?.some(p => p.description.toLowerCase().includes(lowerCaseQuery));

            return publicationMatch || providerNameMatch || specialtyMatch;
        }
    });

  }, [users, searchQuery, feedView]);

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
       {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />)}
          </div>
        ) : (
            <div className="space-y-4">
            {filteredProviders.length > 0 ? (
              filteredProviders.map(provider => <ProviderCard key={provider.id} provider={provider} />)
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
