
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step4_GeneralDetailsProps {
  onBack: () => void;
  onNext: () => void;
}

export default function Step4_GeneralDetails({ onBack, onNext }: Step4_GeneralDetailsProps) {
  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold">Paso 4: Detalles Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="fullname">Nombre Completo <span className="text-destructive">*</span></Label>
                <Input id="fullname" placeholder="Ej: Juan Pérez" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="juan.perez@email.com" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="0412-1234567" />
            </div>
        </div>

         <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Atrás</Button>
            <Button onClick={onNext}>Siguiente</Button>
        </div>
    </div>
  );
}
