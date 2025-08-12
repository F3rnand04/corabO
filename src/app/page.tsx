
"use client";

import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const { currentUser, allPublications, searchQuery, categoryFilter } = useCorabo();
  
  const filteredPublications = useMemo(() => {
    let results = allPublications;

    if (categoryFilter) {
      results = results.filter(p => {
        if (p.type === 'product' && p.productDetails?.category) {
          return p.productDetails.category === categoryFilter;
        }
        if (p.owner?.profileSetupData?.primaryCategory) {
          return p.owner.profileSetupData.primaryCategory === categoryFilter;
        }
        return false;
      });
    }

    if (searchQuery) {
      results = results.filter(p => 
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner?.profileSetupData?.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return results;
  }, [allPublications, searchQuery, categoryFilter]);


  if (!currentUser) {
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
       
        <div className="space-y-4">
        {allPublications.length > 0 ? (
            filteredPublications.map((item, index) => (
                <PublicationCard key={item.id} publication={item} />
            ))
        ) : (
             <div className="text-center text-muted-foreground pt-16">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4"/>
                <p>Cargando publicaciones...</p>
             </div>
        )}
        </div>
    </main>
  );
}
