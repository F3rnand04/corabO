
'use client';

import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Globe, LogOut } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCorabo } from '@/contexts/CoraboContext';
import type { User } from '@/lib/types';
import { checkIdUniqueness, completeInitialSetup } from '@/lib/actions/user.actions';
import { sendMessage } from '@/lib/actions/messaging.actions';


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
  const { logout, firebaseUser } = useAuth();
  const { setCurrentUser } = useCorabo();
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
  const [submissionAttempts, setSubmissionAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    if (firebaseUser) {
      setName(firebaseUser.displayName?.split(' ')[0] || '');
      setLastName(firebaseUser.displayName?.split(' ').slice(1).join(' ') || '');
    }
  }, [firebaseUser]);
  
  const handleSubmit = async () => {
    if (!firebaseUser) return;
    setIsSubmitting(true);
    setIdInUseError(false);

    try {
        const isUnique = await checkIdUniqueness({ idNumber, country, currentUserId: firebaseUser.uid });
        
        if (!isUnique) {
            setIdInUseError(true);
            const newAttemptCount = submissionAttempts + 1;
            setSubmissionAttempts(newAttemptCount);
            
            if (newAttemptCount >= MAX_ATTEMPTS) {
                toast({
                    variant: 'destructive',
                    title: `Demasiados Intentos Fallidos (${MAX_ATTEMPTS})`,
                    description: 'Su documento ya está en uso. Será redirigido al inicio de sesión para proteger su cuenta y la de otros usuarios.',
                    duration: 5000,
                });
                setTimeout(() => {
                    logout();
                }, 5000);
            }
            setIsSubmitting(false); // Stop submission but don't clear form
            return; 
        }
        
        const updatedUser = await completeInitialSetup(
          firebaseUser.uid, 
          { 
            name, 
            lastName, 
            idNumber, 
            birthDate, 
            country,
            type: 'client', // Defaults to client, logic in flow might change it
            providerType: isCompany ? 'company' : 'professional'
          }
        );
        
        // ** THE FIX **: Update client state before redirecting
        setCurrentUser(updatedUser);

        toast({ title: "Perfil Guardado", description: "Tus datos han sido guardados correctamente."});
        
        router.push('/');

    } catch (error: any) {
        console.error("Failed to complete setup:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar tu información. Inténtalo de nuevo.'
        });
    } finally {
        // This will now only be set to false if the operation was successful or had a non-ID related error
        if (idInUseError === false) {
           setIsSubmitting(false);
        }
    }
  };

  const handleContactSupport = () => {
    if(!firebaseUser) return;
    const conversationId = [firebaseUser.uid, 'corabo-admin'].sort().join('-');
    sendMessage({ recipientId: 'corabo-admin', text: "Hola, mi número de documento de identidad ya está en uso y necesito ayuda para verificar mi cuenta.", conversationId, senderId: firebaseUser.uid });
    router.push(`/messages/${conversationId}`);
  };

  if (!firebaseUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
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
                priority
                className="object-contain"
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
            <AlertTitle>Documento en Uso</AlertTitle>
            <AlertDescription>
                Su documento ya está en uso. Por favor, corrígelo. Si crees que es un error, 
                <Button variant="link" className="p-1 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte</Button>.
                 (Intento {submissionAttempts} de {MAX_ATTEMPTS})
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
                    <div className="my-4 p-3 border rounded-md bg-muted/50 text-left text-sm space-y-1">
                        <p><strong>{isCompany ? 'Razón Social' : 'Nombre Completo'}:</strong> {name} {lastName}</p>
                        <p><strong>{idLabel}:</strong> {idNumber}</p>
                        {!isCompany && <p><strong>Fecha de Nacimiento:</strong> {birthDate}</p>}
                        <p><strong>País:</strong> {countries.find(c => c.code === country)?.name}</p>
                    </div>
                    Recuerda que esta información no podrá ser modificada una vez guardada.
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

        <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Volver a la página de inicio
        </Button>

      </CardContent>
    </Card>
  );
}
