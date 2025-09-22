'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Loader2, AlertTriangle, Globe, LogOut, Calendar as CalendarIcon, Building } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, FirebaseUserInput } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { countries } from '@/lib/data/options';
import { useAuth } from '@/hooks/use-auth-provider';

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


interface InitialSetupFormProps {
    user: FirebaseUserInput;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
}

export default function InitialSetupForm({ user, onSubmit, isSubmitting }: InitialSetupFormProps) {
  const { logout } = useAuth();
  
  const [isCompany, setIsCompany] = useState(false);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [country, setCountry] = useState('');
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);


  useEffect(() => {
    if (user) {
        const [firstName, ...restOfName] = (user.displayName || '').split(' ');
        setName(firstName);
        setLastName(restOfName.join(' '));
    }
  }, [user]);

  useEffect(() => {
    if (birthDate && !isCompany) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      if (age < 18) {
        setAgeError("Debes ser mayor de 18 años para registrarte.");
      } else {
        setAgeError(null);
      }
    } else {
      setAgeError(null);
    }
  }, [birthDate, isCompany]);
  
  const handleSubmit = async () => {
    const userData = isCompany ? {
        name: companyName,
        lastName: '',
        idNumber: idNumber,
        birthDate: '',
        country,
        type: 'provider' as const,
        providerType: 'company' as const,
    } : {
        name,
        lastName,
        idNumber,
        birthDate: birthDate?.toISOString(),
        country,
        type: 'client' as const,
        providerType: undefined,
    };
    onSubmit(userData);
  };

  const selectedCountryInfo = countries.find(c => c.code === country);
  const idLabel = isCompany 
    ? (selectedCountryInfo?.companyIdLabel || 'Documento Fiscal')
    : (selectedCountryInfo?.idLabel || 'Documento de Identidad');
  
  const canSubmit = isCompany
    ? companyName && idNumber && country && hasAcceptedPolicies
    : name && lastName && idNumber && birthDate && !ageError && country && hasAcceptedPolicies;

  return (
    <Card className="w-full max-w-md shadow-lg border-none bg-background">
      <CardHeader className="text-center items-center">
        <Image src="/images/logo-light.png" alt="Corabo Logo" width={192} height={96} className="h-24 w-auto mb-4" />
        <CardTitle className="text-2xl">¡Bienvenido a Corabo!</CardTitle>
        <CardDescription>
          Completa tus datos para activar todas las funciones de la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Atención!</AlertTitle>
          <AlertDescription>
            Esta información es privada y se usará para verificar tu identidad. <strong>No podrás modificarla después.</strong> Por favor, asegúrate de que sea correcta.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="is_company" checked={isCompany} onCheckedChange={(checked) => setIsCompany(!!checked)} />
            <Label htmlFor="is_company" className="font-normal text-sm flex items-center gap-2"><Building className="w-4 h-4"/> ¿Eres una Empresa?</Label>
        </div>
        
        <Separator />

        <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2 font-semibold"><Globe className="w-4 h-4"/>País</Label>
            <CountrySelector value={country} onValueChange={setCountry} />
        </div>
        
        <div style={{ display: isCompany ? 'block' : 'none' }} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="companyName" className="font-semibold">Razón Social</Label>
                <Input id="companyName" placeholder="Tu Razón Social, C.A." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="idNumberCompany" className="font-semibold">{idLabel}</Label>
                <Input id="idNumberCompany" placeholder={`Tu ${idLabel.toLowerCase()}`} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
        </div>

        <div style={{ display: !isCompany ? 'block' : 'none' }} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">Nombre(s)</Label>
                <Input id="name" placeholder="Tus nombres" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="lastName" className="font-semibold">Apellido(s)</Label>
                <Input id="lastName" placeholder="Tus apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="idNumberPersonal" className="font-semibold">{idLabel}</Label>
                <Input id="idNumberPersonal" placeholder={`Tu ${idLabel.toLowerCase()}`} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="birthDate" className="font-semibold">Fecha de Nacimiento</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP", { locale: es }) : <span>Elige tu fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={birthDate} onSelect={(date) => {setBirthDate(date); setIsCalendarOpen(false);}} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear() - 18} initialFocus />
                    </PopoverContent>
                </Popover>
                {ageError && <p className="text-sm text-destructive">{ageError}</p>}
            </div>
        </div>
        
        <Separator />

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="terms" checked={hasAcceptedPolicies} onCheckedChange={(checked) => setHasAcceptedPolicies(checked as boolean)} />
          <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            He leído y acepto las{' '}
            <Link href="/policies" target="_blank" className="text-primary underline hover:no-underline">
              Políticas de Servicio
            </Link>
            .
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={!canSubmit || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finalizar Registro'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Los datos son correctos?</AlertDialogTitle>
                    <AlertDialogDescription>
                         <div className="my-4 p-3 border rounded-md bg-muted/50 text-left text-sm space-y-1">
                            {isCompany ? (
                                <>
                                    <p><strong>Razón Social:</strong> {companyName}</p>
                                    <p><strong>{idLabel}:</strong> {idNumber}</p>
                                </>
                            ) : (
                                <>
                                    <p><strong>Nombre:</strong> {name} {lastName}</p>
                                    <p><strong>{idLabel}:</strong> {idNumber}</p>
                                    <p><strong>Nacimiento:</strong> {birthDate ? format(birthDate, "PPP", { locale: es }) : 'N/A'}</p>
                                </>
                            )}
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
        </div>
      </CardContent>
    </Card>
  );
}
