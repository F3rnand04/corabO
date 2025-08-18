
'use client';

import Step5_ProviderDetails from '@/components/profile-setup/Step5_ProviderDetails';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2, Settings, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// This is now the dedicated page for editing details, using the main setup component.

function DetailsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold ml-4 flex items-center gap-2">
                        <Settings className="w-5 h-5"/>
                        Editar Detalles del Perfil
                    </h1>
                </div>
            </div>
        </header>
    );
}


export default function DetailsPage() {
  const { currentUser, updateFullProfile } = useCorabo();
  const router = useRouter();

  if (!currentUser || !currentUser.profileSetupData) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    );
  }

  // The Step5 component now handles its own state and saving logic.
  return (
     <>
      <DetailsHeader />
      <main className="container max-w-4xl mx-auto py-8">
        <Step5_ProviderDetails
            // We pass flags to tell the component it's in "edit mode"
            isEditMode={true}
            // Pass the existing form data
            initialFormData={currentUser.profileSetupData}
            // Pass the user type
            profileType={currentUser.type}
            // The onSave prop will be called by the component's save button
            onSave={async (formData) => {
                await updateFullProfile(currentUser.id, formData, currentUser.type);
                router.push('/profile'); // Go back to profile after saving
            }}
        />
      </main>
    </>
  );
}
