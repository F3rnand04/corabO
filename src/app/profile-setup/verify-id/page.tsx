
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, CheckCircle, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import type { VerificationOutput, User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateUser, autoVerifyIdWithAI } from '@/lib/actions/user.actions';
import { deleteField } from 'firebase/firestore';


const countriesInfo = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF' },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT' },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT' },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF' },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC' },
];

export default function VerifyIdPage() {
  const { currentUser } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationOutput | { error: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to check if user data is ready for verification
  useEffect(() => {
    if (currentUser && currentUser.name && currentUser.idNumber) {
      setIsLoading(false);
      // Check if existing document is a PDF
      if (currentUser.idDocumentUrl && currentUser.idDocumentUrl.startsWith('data:application/pdf')) {
          setIsPdf(true);
          setImagePreview(currentUser.idDocumentUrl);
      } else if (currentUser.idDocumentUrl) {
          setIsPdf(false);
          setImagePreview(currentUser.idDocumentUrl);
      }
    } else if (currentUser) {
        // If user exists but data is missing, redirect to setup
        toast({ variant: 'destructive', title: 'Faltan Datos', description: "Completa tu registro inicial antes de verificar." });
        router.push('/initial-setup');
    }
  }, [currentUser, router, toast]);

  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  const isCompany = currentUser.profileSetupData?.providerType === 'company';
  const countryInfo = countriesInfo.find(c => c.code === currentUser.country);
  const docLabel = isCompany ? (countryInfo?.companyIdLabel || 'Documento Fiscal') : (countryInfo?.idLabel || 'Documento de Identidad');


  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const isPdfFile = file.type === 'application/pdf';
      setIsPdf(isPdfFile);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        // Also update the document URL in the user's profile immediately
        await updateUser(currentUser.id, { idDocumentUrl: dataUrl });
      };
      reader.readAsDataURL(file);
      setVerificationResult(null); // Reset previous results
    }
  };

  const handleClearFile = async () => {
    setImagePreview(null); 
    setImageFile(null); 
    setVerificationResult(null);
    setIsPdf(false);
    if(currentUser) {
        await updateUser(currentUser.id, { idDocumentUrl: deleteField() as any });
    }
  };

  const handleStartVerification = async () => {
    if (!imagePreview || !currentUser) {
      toast({ variant: 'destructive', title: 'Falta Documento', description: 'Por favor, sube una imagen de tu documento.' });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
        const result = await autoVerifyIdWithAI(currentUser as User);
        setVerificationResult(result);
        if (result.nameMatch && result.idMatch) {
            toast({ title: '¡Pre-verificación Exitosa!', description: 'Los datos coinciden. Ahora un agente confirmará tu identidad.' });
            await updateUser(currentUser.id, { idVerificationStatus: 'pending' });
        } else {
             toast({ variant: 'destructive', title: 'Datos no Coinciden', description: 'La IA no pudo verificar tus datos. Un agente lo revisará manualmente.' });
             await updateUser(currentUser.id, { idVerificationStatus: 'pending' });
        }
    } catch (error) {
        console.error("AI Verification failed:", error);
        toast({ variant: 'destructive', title: 'Error de Verificación', description: 'Ocurrió un error al procesar tu documento. Inténtalo de nuevo.' });
    } finally {
        setIsVerifying(false);
    }
  };


  return (
    <div className="container mx-auto max-w-2xl py-8">
        <Card>
            <CardHeader>
                <CardTitle>Verificación de Identidad</CardTitle>
                <CardDescription>Sube una imagen clara de tu documento de identidad para activar todas las funcionalidades de pago y transacciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="space-y-2">
                    <Label htmlFor="id-upload" className="font-semibold">Sube tu {docLabel}</Label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="id-upload" accept="image/*,application/pdf"/>
                    
                    {imagePreview ? (
                        <div className="relative group w-full aspect-[1.58] rounded-md overflow-hidden border bg-muted">
                            {isPdf ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <FileText className="w-16 h-16 text-muted-foreground"/>
                                    <p className="mt-2 font-semibold">Archivo PDF Cargado</p>
                                </div>
                            ) : (
                                <Image src={imagePreview} alt="Vista previa del documento" fill style={{objectFit: 'contain'}}/>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="destructive" size="icon" onClick={handleClearFile}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[1.58] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <UploadCloud className="w-12 h-12 text-muted-foreground"/>
                            <p className="mt-2 font-semibold">Haz clic para subir un archivo</p>
                            <p className="text-sm text-muted-foreground">JPG, PNG o PDF</p>
                        </div>
                    )}
                </div>

                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>¿Por qué es necesario esto?</AlertTitle>
                    <AlertDescription>
                        Verificar tu identidad nos ayuda a mantener la comunidad segura, prevenir fraudes y cumplir con las regulaciones para habilitar transacciones monetarias. Tu documento es confidencial y solo se usa para fines de verificación.
                    </AlertDescription>
                </Alert>
                
                {verificationResult && (
                    <div className="p-4 rounded-lg border bg-background text-sm space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> Resultado de la Verificación Automática</h4>
                        {'error' in verificationResult ? (
                            <p className="text-destructive">{verificationResult.error}</p>
                        ) : (
                            <>
                               <p className={verificationResult.idMatch ? 'text-green-600' : 'text-destructive'}>
                                  <strong>Coincidencia de ID:</strong> {verificationResult.idMatch ? 'Exitosa' : `Fallida (Detectado: ${verificationResult.extractedId})`}
                               </p>
                               <p className={verificationResult.nameMatch ? 'text-green-600' : 'text-destructive'}>
                                  <strong>Coincidencia de Nombre:</strong> {verificationResult.nameMatch ? 'Exitosa' : `Fallida (Detectado: ${verificationResult.extractedName})`}
                               </p>
                            </>
                        )}
                    </div>
                )}

                 <Button onClick={handleStartVerification} disabled={!imagePreview || isVerifying} className="w-full">
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isVerifying ? 'Verificando...' : 'Guardar y Enviar para Verificación'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/profile')} className="w-full">
                    Volver al Perfil
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
