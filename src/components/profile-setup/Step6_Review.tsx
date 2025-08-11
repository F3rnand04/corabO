
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Badge } from "../ui/badge";
import { CheckCircle, Edit, Globe, MapPin, Tag, UserCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { SubscriptionDialog } from '../SubscriptionDialog';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import type { ProfileSetupData } from '@/lib/types';


interface Step6_ReviewProps {
  onBack: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
  profileType: 'client' | 'provider';
  goToStep: (step: number) => void;
}

const allCategories = [
  { id: 'Hogar y Reparaciones', name: 'Hogar y Reparaciones' },
  { id: 'Tecnología y Soporte', name: 'Tecnología y Soporte' },
  { id: 'Automotriz y Repuestos', name: 'Automotriz y Repuestos' },
  { id: 'Alimentos y Restaurantes', name: 'Alimentos y Restaurantes' },
  { id: 'Salud y Bienestar', name: 'Salud y Bienestar' },
  { id: 'Educación', name: 'Educación' },
  { id: 'Eventos', name: 'Eventos' },
  { id: 'Belleza', name: 'Belleza' },
  { id: 'Fletes y Delivery', name: 'Fletes y Delivery' },
];

const MAX_RADIUS_FREE = 10;


export default function Step6_Review({ onBack, formData, setFormData, profileType, goToStep }: Step6_ReviewProps) {
  const { currentUser, updateFullProfile } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);

  const isProvider = profileType === 'provider';
  
  const getCategoryName = (id: string) => allCategories.find(c => c.id === id)?.name || id;

  const handleFinish = async () => {
    if (!currentUser) return;
    if (!hasAcceptedPolicies) {
        toast({
            variant: "destructive",
            title: "Aceptación Requerida",
            description: "Debes aceptar las políticas de servicio y privacidad para continuar."
        });
        return;
    }
    
    await updateFullProfile(currentUser.id, formData, profileType);
    
    if (isProvider && !currentUser.isTransactionsActive) {
      toast({
        title: "¡Perfil Guardado!",
        description: "Ahora, activa tu registro de transacciones para empezar a vender."
      });
      router.push('/transactions/settings');
    } else {
      router.push('/profile');
      toast({
        title: "¡Perfil Actualizado!",
        description: "Tu información ha sido guardada."
      });
    }
  }
  
  const serviceRadius = formData.serviceRadius || 10;
  const isOverFreeRadius = serviceRadius > MAX_RADIUS_FREE && !currentUser?.isSubscribed;

  const renderItem = (label: string, value: React.ReactNode, step: number, children?: React.ReactNode) => (
    <div className="flex justify-between items-start py-4">
        <div className="flex-grow pr-4">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="font-semibold text-foreground mt-1">{value}</div>
            {children}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => goToStep(step)}>
            <Edit className="h-4 w-4"/>
        </Button>
    </div>
  );

  if (!currentUser) return null;

  return (
    <>
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 6: Revisión y Confirmación</h2>
      <p className="text-sm text-muted-foreground">
        Por favor, revisa que toda la información sea correcta antes de finalizar. Puedes volver a cualquier paso para editar.
      </p>

      <Card>
          <CardHeader>
              <CardTitle>Resumen de tu Perfil</CardTitle>
              <CardDescription>Así es como otros usuarios verán tu información pública.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
              {renderItem("Tipo de Perfil", <span className="capitalize">{profileType}</span>, 1)}

              {renderItem("Nombre Público", (
                <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    <span>{formData.useUsername ? formData.username : currentUser.name}</span>
                </div>
              ), 2)}

              {isProvider && formData.categories && formData.categories.length > 0 && renderItem("Categorías", (
                <div className="flex flex-wrap gap-2 pt-1">
                    {formData.categories.map((cat: string) => (
                        <Badge key={cat} variant={cat === formData.primaryCategory ? "default" : "secondary"}>
                           {getCategoryName(cat)}
                        </Badge>
                    ))}
                </div>
              ), 3)}

              {renderItem("Datos Personales y de Contacto", (
                <div className="space-y-2 pt-1 text-sm text-muted-foreground">
                    <p>Nombre: {currentUser.name} {currentUser.lastName}</p>
                    <p>Cédula: {currentUser.idNumber}</p>
                    <p>Fecha de Nacimiento: {currentUser.birthDate}</p>
                    <p className="flex items-center gap-2">
                        {currentUser.emailValidated ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-destructive"/>}
                        {currentUser.email}
                    </p>
                    <p className="flex items-center gap-2">
                         {currentUser.phoneValidated ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-destructive"/>}
                        {currentUser.phone || 'No especificado'}
                    </p>
                </div>
              ), 4)}

              {isProvider && (
                <>
                {formData.specialty && renderItem("Especialidad", (
                     <div className="flex items-start gap-2">
                        <Tag className="w-5 h-5 mt-0.5 text-muted-foreground" />
                        <p className="italic text-foreground/80">"{formData.specialty}"</p>
                    </div>
                ), 5)}

                {formData.location && renderItem("Ubicación y Cobertura", (
                     <div className="space-y-1 pt-1">
                        <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {formData.location}
                        </p>
                         <p className="text-sm text-muted-foreground">{formData.showExactLocation ? "Ubicación exacta visible para clientes." : `Radio de cobertura de ${serviceRadius}km.`}</p>
                        {formData.website && <p className="flex items-center gap-2 text-blue-600"><Globe className="w-4 h-4"/>{formData.website}</p>}
                    </div>
                    ), 5,
                    // Children for radius slider
                    !formData.showExactLocation && (
                        <div className="pt-4 mt-4 border-t">
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="service-radius">Ampliar radio de acción</Label>
                                    <Badge variant={isOverFreeRadius ? "destructive" : "secondary"} className="font-mono">{serviceRadius} km</Badge>
                                </div>
                                <Slider
                                    id="service-radius"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={[serviceRadius]}
                                    onValueChange={(value) => setFormData({...formData, serviceRadius: value[0]})}
                                    className={cn(isOverFreeRadius && '[&_.bg-primary]:bg-destructive')}
                                />
                                {isOverFreeRadius && (
                                    <div className="flex items-center justify-center gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="flex-grow">¡Activa un plan para ampliar tu alcance y obtener la insignia de verificado!</span>
                                        <Button size="sm" className="h-7 text-xs" variant="destructive" onClick={() => setIsSubscriptionDialogOpen(true)}>Suscribir</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
                </>
              )}
          </CardContent>
      </Card>

      <div className="space-y-4 pt-4">
        <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={hasAcceptedPolicies} onCheckedChange={(checked) => setHasAcceptedPolicies(checked as boolean)}/>
            <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
            He leído y acepto las{' '}
            <Link href="/policies" target="_blank" className="text-primary underline hover:no-underline">
                Políticas de Servicio y Privacidad
            </Link>
            .
            </label>
        </div>
      </div>


      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={handleFinish} disabled={!hasAcceptedPolicies}>
            {isProvider && !currentUser.isTransactionsActive ? 'Continuar a Activación' : 'Finalizar Configuración'}
        </Button>
      </div>
    </div>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
