
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

interface Step6_ReviewProps {
  onBack: () => void;
}

export default function Step6_Review({ onBack }: Step6_ReviewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 6: Revisión y Confirmación</h2>
      <p className="text-sm text-muted-foreground">
        Por favor, revisa que toda la información sea correcta antes de finalizar. Puedes volver a cualquier paso para editar.
      </p>

      <div className="space-y-6">
        {/* Placeholder data - In a real app, this would come from the form state */}
        
        <Card>
            <CardHeader>
                <CardTitle>Resumen del Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold">Tipo de Perfil</h4>
                    <p className="text-muted-foreground">Servicio</p>
                </div>
                 <Separator />
                 <div>
                    <h4 className="font-semibold">Nombre de Usuario</h4>
                    <p className="text-muted-foreground">juanperez_dev</p>
                </div>
                 <Separator />
                <div>
                    <h4 className="font-semibold">Categorías</h4>
                    <p className="text-muted-foreground">Tecnología y Soporte, Fletes y Delivery</p>
                </div>
                 <Separator />
                 <div>
                    <h4 className="font-semibold">Detalles Generales</h4>
                    <p className="text-muted-foreground">Juan Pérez</p>
                    <p className="text-muted-foreground">juan.perez@email.com</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button>Finalizar Configuración</Button>
      </div>
    </div>
  );
}
