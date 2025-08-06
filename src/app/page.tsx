

"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ServiceCard } from "@/components/ServiceCard";
import { ProviderCard } from "@/components/ProviderCard";
import { ProductCard } from "@/components/ProductCard";
import type { Service, User, Product } from "@/lib/types";

type FeedItem = (Service & { type: 'service' }) | (Product & { type: 'product' });

export default function HomePage() {
  const { services, users, products, searchQuery, feedView } = useCorabo();

  const providers = users.filter(u => u.type === 'provider' && !u.isPaused);

  const getFilteredItems = () => {
    if (searchQuery.trim() === '') {
        if (feedView === 'servicios') {
            return services.map(s => ({ ...s, type: 'service' as const }));
        }
        return [];
    }

    const servicesWithProvider = services.map(service => {
        const provider = users.find(u => u.id === service.providerId);
        return { ...service, providerName: provider?.name.toLowerCase() || '' };
    });

    const lowerCaseQuery = searchQuery.toLowerCase();

    const filteredServices = servicesWithProvider.filter(service =>
      service.name.toLowerCase().includes(lowerCaseQuery) ||
      service.providerName.includes(lowerCaseQuery)
    );

    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(lowerCaseQuery) ||
      product.description.toLowerCase().includes(lowerCaseQuery)
    );
    
    const combinedFeed: FeedItem[] = [
      ...filteredServices.map(s => ({ ...s, type: 'service' as const })),
      ...filteredProducts.map(p => ({ ...p, type: 'product' as const }))
    ];
    
    return combinedFeed;
  };

  const getFilteredProviders = () => {
     const lowerCaseQuery = searchQuery.toLowerCase();
     
     const filterLogic = (provider: User) => {
        const providerName = provider.profileSetupData?.useUsername 
            ? provider.profileSetupData.username 
            : provider.name;
            
        const providerNameMatch = providerName?.toLowerCase().includes(lowerCaseQuery);
        const specialtyMatch = provider.profileSetupData?.specialty?.toLowerCase().includes(lowerCaseQuery);

        const productMatch = products.some(product => 
            product.providerId === provider.id && (
                product.name.toLowerCase().includes(lowerCaseQuery) ||
                product.description.toLowerCase().includes(lowerCaseQuery)
            )
        );
        
        const serviceMatch = services.some(service => 
            service.providerId === provider.id && (
                service.name.toLowerCase().includes(lowerCaseQuery) || 
                service.category.toLowerCase().includes(lowerCaseQuery)
            )
        );

        return providerNameMatch || productMatch || serviceMatch || specialtyMatch;
     }
     
     const targetProviders = feedView === 'empresas' 
        ? providers.filter(p => p.profileSetupData?.providerType === 'company')
        : providers;
        
    if (lowerCaseQuery.trim() === '') {
        return targetProviders;
    }

    return targetProviders.filter(filterLogic);
  }

  const filteredItems = getFilteredItems();
  const filteredProviders = getFilteredProviders();

  return (
    <main className="container py-4 space-y-6">
      <div className="space-y-4">
        {searchQuery.trim() !== '' ? (
           // Vista de búsqueda: mostrar proveedores que coincidan
           filteredProviders.length > 0 ? (
            filteredProviders.map(provider => <ProviderCard key={provider.id} provider={provider} />)
          ) : (
            <p className="text-center text-muted-foreground">No se encontraron proveedores.</p>
          )
        ) : (
          // Vista por defecto: mostrar según la pestaña
          feedView === 'servicios' ? (
            filteredProviders.length > 0 ? (
              filteredProviders.map(provider => <ProviderCard key={provider.id} provider={provider} />)
            ) : (
               <p className="text-center text-muted-foreground">No se encontraron servicios.</p>
            )
          ) : (
            filteredProviders.length > 0 ? (
              filteredProviders.filter(p => p.profileSetupData?.providerType === 'company').map(provider => <ProviderCard key={provider.id} provider={provider} />)
            ) : (
              <p className="text-center text-muted-foreground">No se encontraron empresas.</p>
            )
          )
        )}
      </div>
    </main>
  );
}
