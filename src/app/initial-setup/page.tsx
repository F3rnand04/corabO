'use client';

import { useState, useEffect, memo } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { checkIdUniquenessFlow, completeInitialSetupFlow } from '@/ai/flows/profile-flow';

const countries = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF' },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT' },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT' },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF' },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC' },
];

// Memoized component to prevent re-render issues
const CountrySelector = memo(function CountrySelector({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) {
    return (
         <Select onValueChange={onValueChange} value={value}>
            <SelectTrigger id="country">
                <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
                {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
        </Select>
    );
});


export default function InitialSetupPage() {
  const { currentUser, sendMessage } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idInUseError, setIdInUseError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setLastName(currentUser.lastName || '');
      setCountry(currentUser.country || '');
      if (currentUser.profileSetupData?.providerType === 'company') {
        setIsCompany(true);
      }
    }
  }, [currentUser]);
  
  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setIdInUseError(false);
    try {
        const isUnique = await checkIdUniquenessFlow({ idNumber, country, currentUserId: currentUser.id });
        
        if (!isUnique) {
            setIdInUseError(true);
            return; // Stop submission
        }
        
        // This call updates the backend.
        await completeInitialSetupFlow({ 
          userId: currentUser.id, 
          name, 
          lastName, 
          idNumber, 
          birthDate, 
          country,
          type: isCompany ? 'provider' : 'client', // Set user type based on checkbox
          providerType: isCompany ? 'company' : 'professional'
        });
        
        toast({ title: "Perfil Guardado", description: "Tus datos han sido guardados correctamente."});
        
        // **FIX**: Force navigation to the home page after successful submission.
        // AppLayout will then re-evaluate the route and take the user to the correct next step.
        router.push('/');
        router.refresh(); // Force a full refresh to re-trigger AppLayout logic

    } catch (error: any) {
        console.error("Failed to complete setup:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar tu información. Inténtalo de nuevo.'
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleContactSupport = () => {
    const supportMessage = "Hola, mi número de documento de identidad ya está en uso y necesito ayuda para verificar mi cuenta.";
    sendMessage({ recipientId: 'corabo-admin', text: supportMessage });
    router.push(`/messages/corabo-admin`);
  };

  if (!currentUser) {
    // This part is handled by AppLayout, but it's a good safeguard.
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  const selectedCountryInfo = countries.find(c => c.code === country);
  const idLabel = isCompany ? (selectedCountryInfo?.companyIdLabel || 'ID Fiscal') : (selectedCountryInfo?.idLabel || 'Documento de Identidad');
  
  const canSubmit = name && idNumber && country && hasAcceptedPolicies && (isCompany || (lastName && birthDate));

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="relative w-32 h-16 mx-auto mb-4">
            <Image
                src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                alt="Corabo logo"
                fill
                style={{objectFit: 'contain'}}
            />
        </div>
        <CardTitle className="text-2xl">¡Bienvenido a Corabo!</CardTitle>
        <CardDescription>
          Completa tus datos para activar todas las funciones de la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {idInUseError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Datos de Identificación en Uso</AlertTitle>
            <AlertDescription>
                El número de documento ingresado ya está registrado. Si crees que es un error,
                <Button variant="link" className="p-1 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte</Button>.
            </AlertDescription>
          </Alert>
        )}
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
                Esta información es privada y se usará para verificar tu identidad. <strong>No podrás modificarla después.</strong>
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2"><Globe className="w-4 h-4"/>País</Label>
            <CountrySelector value={country} onValueChange={setCountry} />
        </div>
        
        <div className="flex items-center space-x-2">
            <Checkbox id="is-company" checked={isCompany} onCheckedChange={(checked) => setIsCompany(checked as boolean)} />
            <Label htmlFor="is-company">Registrar como empresa</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{isCompany ? 'Razón Social' : 'Nombre(s)'}</Label>
          <Input id="name" placeholder={isCompany ? 'Nombre de tu empresa' : 'Tus nombres'} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {!isCompany && (
            <>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido(s)</Label>
              <Input id="lastName" placeholder="Tus apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            </>
        )}
        <div className="space-y-2">
          <Label htmlFor="idNumber">{idLabel}</Label>
          <Input id="idNumber" placeholder={`Tu ${idLabel}`} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox id="terms" checked={hasAcceptedPolicies} onCheckedChange={(checked) => setHasAcceptedPolicies(checked as boolean)} />
          <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            He leído y acepto las{' '}
            <Link href="/policies" target="_blank" className="text-primary underline hover:no-underline">
              Políticas de Servicio y Privacidad
            </Link>
            .
          </label>
        </div>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finalizar Registro'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro que los datos son correctos?</AlertDialogTitle>
                <AlertDialogDescription>
                    Recuerda que tu {isCompany ? 'Razón Social y ID Fiscal' : 'nombre y documento de identidad'} no podrán ser modificados una vez guardados.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Revisar de nuevo</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sí, guardar datos'}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
