
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
        await updateUser(currentUser.id, { idDocumentUrl: deleteField() as an
