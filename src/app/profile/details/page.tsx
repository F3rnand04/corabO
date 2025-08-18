'use client';

import Step5_ProviderDetails from '@/components/profile-setup/Step5_ProviderDetails';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { useState, useEffect } from 'react';
import type { ProfileSetupData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
  const { currentUser } = useCorabo();
  // We need to manage formData locally for this page to work as a standalone editor
  const [formData, setFormData] = useState<ProfileSetupData | null>(null);

  useEffect(() => {
    if(currentUser) {
        setFormData(currentUser.profileSetupData || {});
    }
  }, [currentUser]);

  const handleNext = () => {
      // In this context, "Next" means saving and going back to the profile.
      // The save logic is now inside Step5_ProviderDetails.
  };

  const handleBack = () => {
    // "Back" also goes back to the main profile page.
    // The save logic should be handled by a save button within the component.
  }

  if (!formData) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    )
  }

  return (
    <>
      <main className="container max-w-2xl mx-auto py-8">
        <Step5_ProviderDetails 
            formData={formData} 
            setFormData={setFormData}
            onBack={handleBack}
            onNext={handleNext}
        />
      </main>
    </>
  );
}
