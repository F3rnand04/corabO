'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';

// Este layout proporciona una estructura consistente para el flujo de configuración de la empresa.
// AHORA OBSOLETO Y SERÁ ELIMINADO. LA LÓGICA SE HA MOVIDO A page.tsx
export default function CompanySetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { currentStep, totalSteps } = useMemo(() => {
    const pathMap: { [key: string]: number } = {
        '/profile-setup/company': 1,
        '/profile-setup/company/logistics': 2,
        '/profile-setup/company/legal': 3,
        '/profile-setup/company/review': 4,
    };
    return { currentStep: pathMap[pathname] || 1, totalSteps: 4 };
  }, [pathname]);

  const handleBack = () => {
    // Lógica simple de retroceso
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
