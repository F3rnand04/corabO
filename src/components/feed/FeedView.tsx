
'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import type { GalleryImage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { ActivationWarning } from '@/components/ActivationWarning';
import { PublicationCard } from '@/components/PublicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function FeedView() {
  const { currentUser, allPublications, searchQuery, categoryFilter, isLoadingAuth } = useAuth();
  
  const filteredPublications = useMemo(() => {
    let results = allPublications;

    if (categoryFilter) {
      results = results.filter(p => {
        const pCategory =
          p.productDetails?.category || p.owner?.profileSetupData?.primaryCategory;
        return pCategory === categoryFilter;
      });
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      results = results.filter(
        p =>
          p.description?.toLowerCase().includes(lowerCaseQuery) ||
          p.alt?.toLowerCase().includes(lowerCaseQuery) ||
          p.owner?.name.toLowerCase().includes(lowerCaseQuery) ||
          (p.type === 'product' &&
            p.productDetails?.name.toLowerCase().includes(lowerCaseQuery))
      );
    }
    return results;
  }, [allPublications, searchQuery, categoryFilter]);

  const renderFeedContent = () => {
    if (filteredPublications.length > 0) {
      return (
        <div className="space-y-4 container mx-auto max-w-2xl">
          {filteredPublications.map((item, index) => {
            return <PublicationCard key={item.id || index} publication={item} />;
          })}
        </div>
      );
    }

    return (
      <div className="text-center text-muted-foreground pt-16">
        <p>No hay publicaciones para mostrar.</p>
        <p className="text-xs">Intenta cambiar tus filtros de búsqueda.</p>
      </div>
    );
  };

  if (isLoadingAuth) {
    return (
      <main className="space-y-4 container py-4 mx-auto max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[500px] w-full" />
        ))}
      </main>
    );
  }

  return (
    <>
      <div className="container py-4 mx-auto max-w-2xl">
        {currentUser && !currentUser.isTransactionsActive && (
          <ActivationWarning userType={currentUser.type} />
        )}
      </div>
      {renderFeedContent()}
    </>
  );
}
