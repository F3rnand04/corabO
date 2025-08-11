
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function PublicationsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Publicaciones</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Página en Construcción</h2>
          <p className="text-muted-foreground mt-2">Esta sección estará disponible próximamente.</p>
        </div>
      </main>
    </div>
  );
}
