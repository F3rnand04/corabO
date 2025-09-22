
'use client';

import { useAuth } from '@/hooks/use-auth-provider';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { requestAffiliation } from '@/lib/actions/affiliation.actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AffiliationHandlerProps {
  provider: User;
}

export function AffiliationHandler({ provider }: AffiliationHandlerProps) {
  const { currentUser, isContact } = useAuth();
  const { toast } = useToast();

  const handleRequestAffiliation = async () => {
    if (!currentUser) return;
    try {
      await requestAffiliation(currentUser.id, provider.id);
      toast({
        title: 'Solicitud Enviada',
        description: `Tu solicitud para unirte a la red de ${provider.name} ha sido enviada.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en la Solicitud',
        description: error.message,
      });
    }
  };

  if (!currentUser || currentUser.id === provider.id) {
    return null; // Don't show for self-profile
  }

  // A professional looking at a company profile
  if (currentUser.type === 'provider' && provider.profileSetupData?.providerType === 'company') {
    return (
      <div className="px-4">
        <Button onClick={handleRequestAffiliation} className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          Solicitar Verificación de Empresa
        </Button>
      </div>
    );
  }

  // A company looking at a professional's profile (logic to accept is in admin panel)
  // or a client looking at a professional profile
  if (provider.activeAffiliation) {
    return (
      <div className="px-4">
         <Link href={`/companies/${provider.activeAffiliation.companyId}`} className="group block">
            <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 border hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 shrink-0 bg-background rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Verificado por:</p>
                    <p className="font-semibold text-foreground group-hover:underline">{provider.activeAffiliation.companyName}</p>
                    <p className="text-xs text-muted-foreground">{provider.activeAffiliation.companySpecialty}</p>
                </div>
            </div>
        </Link>
      </div>
    );
  }

  return null;
}
