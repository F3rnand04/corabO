

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
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function InitialSetupPage() {
  const { currentUser, completeInitialSetup } = useCorabo();
  const { toast } = useToast();
  
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lastName || !idNumber || !birthDate) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }
    if (!hasAcceptedPolicies) {
      toast({
        variant: 'destructive',
        title: 'Políticas no aceptadas',
        description: 'Debes aceptar las políticas para continuar.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        await completeInitialSetup(currentUser!.id, { lastName, idNumber, birthDate });
        // The context change will trigger the AppLayout to redirect automatically.
        // We don't need to manually push the route.
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

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="relative w-32 h-16 mx-auto mb-4">
            <Image 
                src="https://i.postimg.cc/Wz1MTvWK/lg.png"
                alt="Corabo logo"
                layout="fill"
                objectFit="contain"
            />
        </div>
        <CardTitle className="text-2xl">¡Casi listo, {currentUser.name}!</CardTitle>
        <CardDescription>
          Necesitamos algunos datos adicionales para completar tu perfil. Esta información es privada y no se podrá modificar después.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finalizar Registro'}
        </Button>
      </CardContent>
    </Card>
  );
}
