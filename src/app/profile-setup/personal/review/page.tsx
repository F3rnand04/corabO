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

  if (!currentUser || !currentUser.profileSetupData) {
    return (
        <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const handleFinalSubmit = async () => {
    if (!currentUser?.profileSetupData) return;
    setIsSubmitting(true);
    
    try {
        await becomeProvider(currentUser.id, currentUser.profileSetupData);
        
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            type: currentUser.profileSetupData.providerType === 'delivery' ? 'repartidor' : 'provider',
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
