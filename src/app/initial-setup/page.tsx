
'use client';

import { useState, useEffect } from 'react';
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
import { checkIdUniquenessFlow } from '@/ai/flows/profile-flow';

const countries = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad' },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía' },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI' },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE' },
  { code: 'MX', name: 'México', idLabel: 'CURP' },
];

export default function InitialSetupPage() {
  const { currentUser, completeInitialSetup, sendMessage } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idInUseError, setIdInUseError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setLastName(currentUser.lastName || '');
      setCountry(currentUser.country || '');
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setIdInUseError(false);
    try {
        // Step 1: Check for ID uniqueness before proceeding
        const isUnique = await checkIdUniquenessFlow({ idNumber, country, currentUserId: currentUser.id });
        
        if (!isUnique) {
            setIdInUseError(true);
            setIsSubmitting(false);
            return;
        }

        // Step 2: If unique, complete the setup
        await completeInitialSetup(currentUser.id, { name, lastName, idNumber, birthDate, country });
        // The context change will trigger the AppLayout to redirect automatically.
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
    const conversationId = sendMessage({ recipientId: 'corabo-admin', text: supportMessage });
    router.push(`/messages/${conversationId}`);
  };

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const selectedCountryLabel = countries.find(c => c.code === country)?.idLabel || 'Documento de Identidad';
  const canSubmit = name && lastName && idNumber && birthDate && country && hasAcceptedPolicies;

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
                El número de documento ingresado ya está registrado en nuestro sistema para el país seleccionado. Si crees que esto es un error, por favor
                <Button variant="link" className="p-1 h-auto text-current underline" onClick={handleContactSupport}>contacta a soporte</Button>.
            </AlertDescription>
          </Alert>
        )}
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
                Esta información es privada y se usará para verificar tu identidad. <strong>No podrás modificarla después.</strong> Por favor, asegúrate de que sea correcta.
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2"><Globe className="w-4 h-4"/>País</Label>
            <Select onValueChange={(value) => setCountry(value)} value={country}>
                <SelectTrigger id="country">
                    <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                    {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre(s)</Label>
          <Input id="name" placeholder="Tus nombres" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido(s)</Label>
          <Input id="lastName" placeholder="Tus apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">{selectedCountryLabel}</Label>
          <Input id="idNumber" placeholder="Tu número de identificación" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
          <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
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
                  Finalizar Registro
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro que los datos son correctos?</AlertDialogTitle>
                <AlertDialogDescription>
                    Recuerda que tu nombre, apellido y documento de identidad no podrán ser modificados una vez guardados.
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
