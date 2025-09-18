
'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { becomeProvider } from "@/lib/actions/user.actions";
import type { ProfileSetupData } from "@/lib/types";
import Step4_Review from "@/components/profile-setup/company/Step4_Review";
import { useAuth } from "@/hooks/use-auth";

export default function ReviewPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleFinalSubmit = async () => {
    if (!currentUser.profileSetupData) return;
    setIsSubmitting(true);
    try {
        await becomeProvider(currentUser.id, currentUser.profileSetupData);
        // Also update local state to reflect transaction activation
        setCurrentUser(prev => prev ? { ...prev, type: 'provider', isTransactionsActive: true } : null);
        toast({ title: "¡Perfil Actualizado!", description: "La información de tu empresa ha sido guardada."});
        router.push('/profile');
    } catch(error: any) {
        console.error("Error submitting company profile data:", error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "No se pudo guardar tu configuración."});
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Step4_Review
      formData={currentUser.profileSetupData || {}}
      onSubmit={handleFinalSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
