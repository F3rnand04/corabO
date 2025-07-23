"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { ProviderCard } from '@/components/ProviderCard';

export default function CompaniesPage() {
  const { users } = useCorabo();
  // Assuming 'provider' type users are the companies
  const companies = users.filter(u => u.type === 'provider');

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Empresas</h1>
      <p className="text-muted-foreground mb-8">Explora las empresas y sus productos.</p>
      
      {companies.length > 0 ? (
        <div className="space-y-4">
          {companies.map(company => (
            <ProviderCard key={company.id} provider={company} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No hay empresas disponibles.</p>
        </div>
      )}
    </main>
  );
}
