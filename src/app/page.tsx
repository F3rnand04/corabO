"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProviderCard } from '@/components/ProviderCard';
import { ProductCard } from '@/components/ProductCard';
import { ServiceCard } from '@/components/ServiceCard';

export default function Home() {
  const { users, searchQuery, feedView, products, services } = useCorabo();
  
  const allProviders = users.filter(u => u.type === 'provider');
  
  const filteredProviders = allProviders.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const providersToShow = searchQuery ? filteredProviders : allProviders;

  const repeatedProviders = new Array(5).fill(null).flatMap((_, i) => 
    providersToShow.map(provider => ({ ...provider, key: `${provider.id}-${i}` }))
  );
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-2">
      {feedView === 'empresas' && (
        <div className="space-y-4">
          {repeatedProviders.map(provider => (
            <ProviderCard key={provider.key} provider={provider} />
          ))}
        </div>
      )}
      {feedView === 'servicios' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
