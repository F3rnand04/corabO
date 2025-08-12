
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Importación correcta

export default function InitialSetupPage() {
  const { currentUser, completeInitialSetup } = useCorabo();
  const { toast } = useToast();

  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        await completeInitialSetup(currentUser!.id, { lastName, idNumber, birthDate });
        // The context change will trigger the AppLayout to redirect automatically.
    } catch (error) {
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

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const canSubmit = lastName && idNumber && birthDate && hasAcceptedPolicies;

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
        <CardTitle className="text-2xl">¡Casi listo, {currentUser.name}!</CardTitle>
        <CardDescription>
          Necesitamos algunos datos adicionales para completar tu perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
                Esta información es privada y se usará para verificar tu identidad. <strong>No podrás modificarla después.</strong> Por favor, asegúrate de que sea correcta.
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" placeholder="Tu apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">Cédula de Identidad</Label>
          <Input id="idNumber" placeholder="V-12.345.678" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
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
                    Recuerda que tu nombre, apellido, cédula y fecha de nacimiento no podrán ser modificados una vez guardados.
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
