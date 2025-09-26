'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { becomeProvider } from "@/lib/actions/user.actions";
import Step5_Review from "@/components/profile-setup/personal/Step5_Review";
import { useAuth } from "@/hooks/use-auth-provider";
import { Loader2 } from "lucide-react";

export default function ReviewPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We show a loader if the necessary data is not yet available.
  // This also prevents rendering the component with incomplete data.
  if (!currentUser || !currentUser.profileSetupData) {
    return (
        <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const handleFinalSubmit = async () => {
    // Create a stable reference to the profile data after checking for its existence.
    const profileData = currentUser.profileSetupData;

    if (!profileData) {
        toast({ variant: 'destructive', title: "Error", description: "No se encontraron los datos del perfil para enviar." });
        return;
    }

    setIsSubmitting(true);
    
    try {
        await becomeProvider(currentUser.id, profileData);
        
        // Use the stable `profileData` reference inside the state updater.
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            type: profileData.providerType === 'delivery' ? 'repartidor' : 'provider',
            isTransactionsActive: true
          }
        });

        toast({ title: "¡Felicidades, ya eres proveedor!", description: "Tu perfil ha sido actualizado y tu registro de transacciones está activo."});
        router.push('/profile');
    } catch(error: any) {
        console.error("Error submitting profile data:", error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "No se pudo guardar tu nueva configuración."});
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Step5_Review
      formData={currentUser.profileSetupData}
      onSubmit={handleFinalSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
