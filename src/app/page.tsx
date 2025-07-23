"use client";

import { useCorabo } from "@/contexts/CoraboContext";
import { ServiceCard } from "@/components/ServiceCard";
import { ProviderCard } from "@/components/ProviderCard";

export default function HomePage() {
  const { services, users, searchQuery, feedView } = useCorabo();

  const providers = users.filter(u => u.type === 'provider');

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    users.find(u => u.id === service.providerId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="container py-4">
      <div className="space-y-4">
        {feedView === 'servicios' ? (
          filteredServices.length > 0 ? (
            filteredServices.map(service => <ServiceCard key={service.id} service={service} />)
          ) : (
            <p className="text-center text-muted-foreground">No se encontraron servicios.</p>
          )
        ) : (
          filteredProviders.length > 0 ? (
            filteredProviders.map(provider => <ProviderCard key={provider.id} provider={provider} />)
          ) : (
            <p className="text-center text-muted-foreground">No se encontraron empresas.</p>
          )
        )}
      </div>
    </main>
  );
}
