
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useCorabo } from "@/contexts/CoraboContext";
import { Badge } from "../ui/badge";
import { CheckCircle, Edit, Globe, MapPin, Tag, UserCircle, XCircle } from "lucide-react";

interface Step6_ReviewProps {
  onBack: () => void;
  formData: any;
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

export default function Step6_Review({ onBack, formData, profileType, goToStep }: Step6_ReviewProps) {
  const { currentUser } = useCorabo();
  const isProvider = profileType === 'provider';
  
  const getCategoryName = (id: string) => allCategories.find(c => c.id === id)?.name || id;

  const renderItem = (label: string, value: React.ReactNode, step: number) => (
    <div className="flex justify-between items-start py-3">
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="font-semibold text-foreground">{value}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goToStep(step)}>
            <Edit className="h-4 w-4"/>
        </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 6: Revisión y Confirmación</h2>
      <p className="text-sm text-muted-foreground">
        Por favor, revisa que toda la información sea correcta antes de finalizar. Puedes volver a cualquier paso para editar.
      </p>

      <Card>
          <CardHeader>
              <CardTitle>Resumen de tu Perfil</CardTitle>
              <CardDescription>Así es como otros usuarios verán tu información.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
              {renderItem("Tipo de Perfil", <span className="capitalize">{profileType}</span>, 1)}

              {renderItem("Nombre Público", (
                <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    <span>{formData.useUsername ? formData.username : currentUser.name}</span>
                </div>
              ), 2)}

              {isProvider && renderItem("Categorías", (
                <div className="flex flex-wrap gap-2 pt-1">
                    {formData.categories.map((cat: string) => (
                        <Badge key={cat} variant={cat === formData.primaryCategory ? "default" : "secondary"}>
                           {getCategoryName(cat)}
                        </Badge>
                    ))}
                </div>
              ), 3)}

              {renderItem("Información de Contacto", (
                <div className="space-y-1 pt-1">
                    <p className="flex items-center gap-2">
                        {currentUser.emailValidated ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-destructive"/>}
                        {formData.email}
                    </p>
                    <p className="flex items-center gap-2">
                         {currentUser.phoneValidated ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-destructive"/>}
                        {formData.phone || 'No especificado'}
                    </p>
                </div>
              ), 4)}

              {isProvider && (
                <>
                {renderItem("Especialidad", (
                     <div className="flex items-start gap-2">
                        <Tag className="w-5 h-5 mt-0.5 text-muted-foreground" />
                        <p className="italic text-foreground/80">"{formData.specialty || 'No especificado'}"</p>
                    </div>
                ), 5)}

                {renderItem("Ubicación y Cobertura", (
                     <div className="space-y-1 pt-1">
                        <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {formData.location}
                        </p>
                        <p>{formData.showExactLocation ? "Ubicación exacta visible" : `Cobertura de ${formData.serviceRadius}km`}</p>
                        {formData.website && <p className="flex items-center gap-2 text-blue-600"><Globe className="w-4 h-4"/>{formData.website}</p>}
                    </div>
                ), 5)}
                </>
              )}
          </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button>Finalizar Configuración</Button>
      </div>
    </div>
  );
}
