"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProviderCard } from '@/components/ProviderCard';

export default function Home() {
  const { users } = useCorabo();
  const providers = users.filter(u => u.type === 'provider');

  return (
    <div className="container px-2">
      <div className="space-y-4">
        {providers.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
        {/* Simulate infinite scroll */}
         {providers.map(provider => (
          <ProviderCard key={`${provider.id}-2`} provider={provider} />
        ))}
         {providers.map(provider => (
          <ProviderCard key={`${provider.id}-3`} provider={provider} />
        ))}
      </div>
    </div>
  );
}
