"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProviderCard } from '@/components/ProviderCard';

export default function Home() {
  const { users, searchQuery } = useCorabo();
  
  const allProviders = users.filter(u => u.type === 'provider');
  
  const filteredProviders = allProviders.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const providersToShow = searchQuery ? filteredProviders : allProviders;

  const repeatedProviders = new Array(5).fill(null).flatMap((_, i) => 
    providersToShow.map(provider => ({ ...provider, key: `${provider.id}-${i}` }))
  );

  return (
    <div className="container px-2">
      <div className="space-y-4">
        {repeatedProviders.map(provider => (
          <ProviderCard key={provider.key} provider={provider} />
        ))}
      </div>
    </div>
  );
}
