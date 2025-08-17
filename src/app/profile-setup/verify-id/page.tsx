
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { VerificationOutput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const countriesInfo = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF' },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT' },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT' },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF' },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC' },
];

export default function VerifyIdPage() {
  const { currentUser, autoVerifyIdWithAI, updateUser } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationOutput | { error: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to check if user data is ready for verification
  useEffect(() => {
    if (currentUser && currentUser.name && currentUser.idNumber) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentUser]);

  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  const isCompany = currentUser.profileSetupData?.providerType === 'company';
  const countryInfo = countriesInfo.find(c => c.code === currentUser.country);
  const docLabel = isCompany ? (countryInfo?.companyIdLabel || 'Documento Fiscal') : (countryInfo?.idLabel || 'Documento de Identidad');


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        // Also update the document URL in the user's profile immediately
        updateUser(currentUser.id, { idDocumentUrl: dataUrl });
      };
      reader.readAsDataURL(file);
      setVerificationResult(null); // Reset previous results
    }
  };

  const handleAutoVerify = async () => {
    // Re-check for required data right before calling the AI flow
    if (!currentUser.idDocumentUrl || !currentUser.name || !currentUser.idNumber) {
       toast({ variant: 'destructive', title: 'Error de Datos', description: "Faltan datos del usuario o el documento. Por favor, recarga la página." });
       return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    try {
        const result = await autoVerifyIdWithAI(currentUser);
        setVerificationResult(result);
        if (result.idMatch && result.nameMatch) {
            toast({
                title: "¡Verificación Exitosa!",
                description: "Tus datos han sido confirmados. Ahora puedes activar tus transacciones.",
                className: "bg-green-100 border-green-200"
            });
            await updateUser(currentUser.id, { idVerificationStatus: 'verified', verified: true });
            router.push('/transactions/settings');
        } else {
             toast({
                variant: 'destructive',
                title: "Verificación Automática Fallida",
                description: "Los datos no coinciden. Tu solicitud pasará a revisión manual.",
            });
            await updateUser(currentUser.id, { idVerificationStatus: 'pending' });
        }
    } catch (error: any) {
        setVerificationResult({ error: 'Fallo al ejecutar la verificación por IA.' });
        toast({ variant: 'destructive', title: 'Error de IA', description: error.message });
    } finally {
        setIsVerifying(false);
    }
  };

  const handleManualReview = async () => {
    if(!currentUser || !currentUser.idDocumentUrl) return;
    await updateUser(currentUser.id, { idVerificationStatus: 'pending' });
    toast({
        title: "Solicitud Enviada a Revisión",
        description: "Nuestro equipo revisará tu documento en las próximas 24-48 horas."
    });
    router.push('/');
  }

  const allChecksPass = verificationResult && !('error' in verificationResult) && verificationResult.idMatch && verificationResult.nameMatch;
  const canVerify = !!currentUser.idDocumentUrl && !isLoading;


  return (
    <div className="bg-muted/40 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>{isCompany ? 'Verificación de Empresa' : 'Verificación de Identidad'}</CardTitle>
          <CardDescription>
            Sube una foto clara de tu <strong>{docLabel}</strong> para activar las funciones de pago.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="id-document">{docLabel} (PDF o Imagen)</Label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            {imagePreview || currentUser.idDocumentUrl ? (
              <div className="relative group w-full aspect-[1.58] rounded-md overflow-hidden bg-black">
                <Image src={imagePreview || currentUser.idDocumentUrl!} alt="Vista previa del documento" fill style={{ objectFit: 'contain' }} sizes="400px"/>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setImagePreview(null); setImageFile(null); setVerificationResult(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-full aspect-video border-2 border-dashed border-muted-foreground rounded-md flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 mb-2" />
                <p className="text-sm font-semibold">Haz clic para subir un archivo</p>
                <p className="text-xs">Asegúrate de que sea legible</p>
              </div>
            )}
          </div>
          
          {verificationResult && (
            <div className="mt-4 p-3 rounded-md border text-sm space-y-2">
              <h5 className="font-semibold mb-2">Resultado de la Verificación:</h5>
              {'error' in verificationResult ? (
                <p className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {verificationResult.error}</p>
              ) : (
                <>
                  <p className={`flex items-center gap-2 ${verificationResult.nameMatch ? 'text-green-600' : 'text-destructive'}`}>
                    {verificationResult.nameMatch ? <CheckCircle className="h-4 w-4"/> : <AlertTriangle className="h-4 w-4"/>}
                    Nombre: {verificationResult.extractedName}
                  </p>
                  <p className={`flex items-center gap-2 ${verificationResult.idMatch ? 'text-green-600' : 'text-destructive'}`}>
                    {verificationResult.idMatch ? <CheckCircle className="h-4 w-4"/> : <AlertTriangle className="h-4 w-4"/>}
                    ID: {verificationResult.extractedId}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button className="w-full" onClick={handleAutoVerify} disabled={!canVerify || isVerifying}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                Verificar con IA
            </Button>
            {(!allChecksPass) && (
                 <Button className="w-full" variant="secondary" onClick={handleManualReview} disabled={!canVerify || isVerifying}>
                    Enviar para Revisión Manual
                </Button>
            )}
          </div>

          <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>¿Por qué hacemos esto?</AlertTitle>
              <AlertDescription>
                Verificar tu identidad o empresa es un paso crucial para construir una comunidad segura y confiable, y para cumplir con las regulaciones de prevención de fraude.
              </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
}
