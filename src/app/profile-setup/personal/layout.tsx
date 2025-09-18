
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';

// This layout is for the multi-step personal provider setup flow.
export default function PersonalProviderSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { currentStep, totalSteps } = useMemo(() => {
    const pathMap: { [key: string]: number } = {
        '/profile-setup/personal': 1,
        '/profile-setup/personal/details': 2,
        '/profile-setup/personal/category': 3,
        '/profile-setup/personal/logistics': 4,
        '/profile-setup/personal/legal': 5,
        '/profile-setup/personal/review': 6,
    };
    return { currentStep: pathMap[pathname] || 1, totalSteps: 6 };
  }, [pathname]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-8">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Atrás
            </Button>
             <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Paso {currentStep} de {totalSteps}</p>
                <ProgressBar current={currentStep} total={totalSteps} />
            </div>
        </div>
        {children}
    </div>
  );
}
