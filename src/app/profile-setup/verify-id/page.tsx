
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, FileText, AlertTriangle } from 'lucide-react';
import type { User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateUser } from '@/lib/actions/user.actions';
import { deleteField } from 'firebase/firestore';

const countriesInfo = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF' },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT' },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT' },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF' },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC' },
];

export default function VerifyIdPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && currentUser.name && currentUser.idNumber) {
      setIsLoading(false);
      if (currentUser.idDocumentUrl) {
          const isPdfDoc = currentUser.idDocumentUrl.startsWith('data:application/pdf');
          setIsPdf(isPdfDoc);
          setImagePreview(currentUser.idDocumentUrl);
      }
    } else if (currentUser) {
        toast({ variant: 'destructive', title: 'Faltan Datos', description: "Completa tu registro inicial antes de verificar." });
        router.push('/profile-setup');
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
        await updateUser(currentUser.id, { idDocumentUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = async () => {
    setImagePreview(null); 
    setImageFile(null);
    setIsPdf(false);
    if(currentUser) {
        await updateUser(currentUser.id, { idDocumentUrl: deleteField() as any });
    }
  };

  const handleSubmitForReview = async () => {
    if (!imagePreview || !currentUser) {
      toast({ variant: 'destructive', title: 'Falta Documento', description: 'Por favor, sube una imagen de tu documento.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
        const updates = {
            idVerificationStatus: 'pending' as const,
            isTransactionsActive: true,
        };
        await updateUser(currentUser.id, updates);
        
        // Optimistically update current user state
        setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);

        toast({
            title: '¡Cuenta Activada!',
            description: 'Tus transacciones han sido habilitadas. Tu documento será revisado por un administrador pronto.',
            className: 'bg-green-100 text-green-800',
        });

        router.push('/profile');

    } catch (error) {
        console.error("Submission for review failed:", error);
        toast({ variant: 'destructive', title: 'Error de Envío', description: 'Ocurrió un error. Inténtalo de nuevo.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
        <Card>
            <CardHeader>
                <CardTitle>Verificación y Activación de Cuenta</CardTitle>
                <CardDescription>Sube tu documento para activar las transacciones. Un administrador lo revisará más tarde.</CardDescription>
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
                    <AlertTitle>Activación Inmediata</AlertTitle>
                    <AlertDescription>
                        Al enviar tu documento, tu cuenta será activada para transacciones inmediatamente. La verificación manual se completará luego para garantizar la seguridad de la comunidad.
                    </AlertDescription>
                </Alert>

                 <Button onClick={handleSubmitForReview} disabled={!imagePreview || isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isSubmitting ? 'Enviando...' : 'Enviar a Revisión y Activar Cuenta'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/profile')} className="w-full">
                    Volver al Perfil
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
