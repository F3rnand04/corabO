
'use client';

import { useMemo, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/types";
import { useCorabo } from "@/contexts/CoraboContext";
import { ActivationWarning } from "@/components/ActivationWarning";
import { PublicationCard } from "@/components/PublicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from '@/lib/actions/feed.actions';
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import Image from "next/image";

export function FeedClientComponent() {
  const { currentUser, isLoadingUser, searchQuery, categoryFilter } = useCorabo();
  const router = useRouter();
  
  const [publications, setPublications] = useState<GalleryImage[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  useEffect(() => {
    if (!isLoadingUser && currentUser) {
        setIsLoadingFeed(true);
        getFeed({ limitNum: 20 })
            .then(result => {
                if (result.publications) {
                    setPublications(result.publications as GalleryImage[]);
                }
            })
            .catch(error => {
                console.error("Failed to fetch feed:", error);
                setPublications([]);
            })
            .finally(() => {
                setIsLoadingFeed(false);
            });
    } else if (!isLoadingUser && !currentUser) {
        setIsLoadingFeed(false);
        setPublications([]);
    }
  }, [currentUser, isLoadingUser]);
  
  const filteredPublications = useMemo(() => {
    let results = publications;

    if (categoryFilter) {
      results = results.filter(p => {
        const pCategory = p.productDetails?.category || p.owner?.profileSetupData?.primaryCategory;
        return pCategory === categoryFilter;
      });
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      results = results.filter(p => 
          p.description?.toLowerCase().includes(lowerCaseQuery) ||
          p.alt?.toLowerCase().includes(lowerCaseQuery) ||
          p.owner?.name.toLowerCase().includes(lowerCaseQuery) ||
          (p.type === 'product' && p.productDetails?.name.toLowerCase().includes(lowerCaseQuery))
      );
    }
    return results;
  }, [publications, searchQuery, categoryFilter]);


  const renderFeedContent = () => {
    if (filteredPublications.length > 0) {
      return (
        <div className="space-y-4 container mx-auto max-w-2xl">
          {filteredPublications.map((item, index) => (
              <PublicationCard key={item.id || index} publication={item} />
          ))}
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

  if (isLoadingUser || isLoadingFeed) {
    return (
      <main className="space-y-4 container py-4 mx-auto max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full" />)}
      </main>
    );
  }

  if (!currentUser) {
    return (
        <div className="relative h-screen flex flex-col items-center justify-center text-center p-4 bg-black text-white overflow-hidden">
            <Image
                src="https://i.postimg.cc/C1sxJnNT/bv.png"
                alt="Fondo de bienvenida"
                fill
                priority
                className="object-cover opacity-50"
                data-ai-hint="background office"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="relative z-10 flex flex-col items-center">
                 <div className="relative w-48 h-24 mx-auto mb-6">
                    <Image
                        src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                        alt="Corabo logo"
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain"
                    />
                </div>
                <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Conecta. Colabora. Crece.</h1>
                <p className="mt-4 max-w-xl text-lg text-white/80 drop-shadow-md">
                    Tu nueva plataforma de confianza para encontrar profesionales talentosos y clientes que valoran tu trabajo. Únete a la comunidad y lleva tus proyectos al siguiente nivel.
                </p>
                <Button className="mt-8" size="lg" onClick={() => router.push('/login')}>
                    <LogIn className="mr-2 h-5 w-5" />
                    Iniciar Sesión o Registrarse
                </Button>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="container py-4 mx-auto max-w-2xl">
        {!currentUser.isTransactionsActive && (
          <ActivationWarning userType={currentUser.type} />
        )}
      </div>
      {renderFeedContent()}
    </>
  );
}
