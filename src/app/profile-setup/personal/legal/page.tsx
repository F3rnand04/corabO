'use client';

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth-provider";
import Step5_Legal from "@/components/profile-setup/personal/Step5_Legal";
import { Loader2 } from "lucide-react";

export default function LegalInfoPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) {
      return (
          <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  const handleNext = () => {
    router.push('/profile-setup/personal/review');
  };

  return (
    <Step5_Legal
      currentUser={currentUser}
      onNext={handleNext}
    />
  );
}
