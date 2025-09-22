'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import InitialSetupFormComponent from '@/components/profile-setup/InitialSetupForm';
import { completeInitialSetup } from '@/lib/actions/user.actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InitialSetupPage() {
  const { firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!firebaseUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await completeInitialSetup(firebaseUser.id, data);
      // The redirect is handled automatically by the AuthProvider now
    } catch (error: any) {
      console.error("Initial setup failed:", error);
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: error.message || "No se pudo completar el registro.",
      });
      setIsSubmitting(false);
    }
  };

  return <InitialSetupFormComponent user={firebaseUser} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}
