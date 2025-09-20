'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { becomeProvider } from "@/lib/actions/user.actions";
import type { ProfileSetupData } from "@/lib/types";
import Step6Review from "@/components/profile-setup/personal/Step6_Review";
import { useAuth } from "@/hooks/use-auth";

export default function ReviewPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for the editable fields on the review page
  const [formData, setFormData] = useState<Partial<ProfileSetupData>>(currentUser?.profileSetupData || {});

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(currentUser.profileSetupData);
    }
  }, [currentUser]);

  const handleFinalSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    
    // We send the latest formData from our local state
    const finalData = { ...formData };

    try {
        await becomeProvider(currentUser.id, finalData as ProfileSetupData);
        
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            type: finalData.providerType === 'delivery' ? 'repartidor' : 'provider',
            profileSetupData: {
              ...(prevUser.profileSetupData || {}),
              ...finalData,
            },
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
    <Step6Review
      formData={formData}
      onUpdate={setFormData}
      onSubmit={handleFinalSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
