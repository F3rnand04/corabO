
'use client';

import { ProfileDetailsTab } from '@/components/profile/ProfileDetailsTab';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function DetailsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold ml-4">Editar Detalles del Perfil</h1>
                </div>
            </div>
        </header>
    );
}


export default function DetailsPage() {
  return (
    <>
      <DetailsHeader />
      <main className="container max-w-2xl mx-auto py-8">
        <ProfileDetailsTab />
      </main>
    </>
  );
}
