
'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth-provider";

const ReviewItem = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium leading-none text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
};

export default function LegalInfoPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    router.push('/profile-setup/personal/review');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Paso 5: Representación Legal</h2>
        <p className="text-sm text-muted-foreground">
          Como proveedor individual, tú eres tu propio representante legal.
        </p>
      </div>
      
      <Card className="bg-background/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary"/>
            Tus Datos Registrados
          </CardTitle>
          <CardDescription>
            Esta es la información que se utilizará para fines legales y de facturación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReviewItem label="Nombre Completo" value={`${currentUser?.name || ''} ${currentUser?.lastName || ''}`.trim()} />
          <ReviewItem label="Documento de Identidad" value={currentUser?.idNumber} />
          <ReviewItem label="Teléfono de Contacto" value={currentUser?.phone} />
        </CardContent>
      </Card>
      
      <Button onClick={handleNext} className="w-full">
        Continuar a Revisión
      </Button>
    </div>
  );
}
