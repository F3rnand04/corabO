
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { UploadCloud, Trash2, MapPin } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';

interface Step5_SpecificDetailsProps {
  onBack: () => void;
  onNext: () => void;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Step5_SpecificDetails({ onBack, onNext }: Step5_SpecificDetailsProps) {
  const [images, setImages] = useState<{ id: number; src: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serviceRadius, setServiceRadius] = useState(30);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.map((file, index) => ({
      id: Date.now() + index,
      src: URL.createObjectURL(file),
      file: file,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: number) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Paso 5: Detalles Específicos del Proveedor</h2>
      
      {/* Bio / Description */}
      <div className="space-y-2">
        <Label htmlFor="bio">Biografía / Descripción del Servicio</Label>
        <Textarea id="bio" placeholder="Describe tu servicio, tu experiencia y lo que te hace único." rows={5} />
      </div>

      {/* Portfolio / Gallery */}
      <div className="space-y-4">
        <Label>Portafolio / Galería de Imágenes</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map(image => (
                <div key={image.id} className="relative group aspect-square">
                    <Image src={image.src} alt="preview" fill className="rounded-md object-cover" />
                    <Button
                        variant="destructive" size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-colors"
            >
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-center mt-1 text-muted-foreground">Añadir</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
        </div>
      </div>
      
       {/* Service Area */}
      <div className="space-y-4">
        <Label>Ubicación y Área de Servicio</Label>
        <div className="space-y-3 rounded-md border p-4">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="serviceArea" placeholder="Ej: Av. Principal, Local 5, Caracas" className="pl-10"/>
            </div>
            <div className="flex items-center justify-between">
                 <Label htmlFor="show-exact-location" className="flex items-center gap-2">
                    <Switch id="show-exact-location" />
                    Mostrar ubicación exacta
                 </Label>
            </div>
             <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="service-radius">Radio de servicio</Label>
                    <Badge variant="outline" className="font-mono">{serviceRadius} km</Badge>
                </div>
                <Slider
                    id="service-radius"
                    min={5}
                    max={100}
                    step={5}
                    value={[serviceRadius]}
                    onValueChange={(value) => setServiceRadius(value[0])}
                />
                <p className="text-xs text-muted-foreground">Define el alcance de tu servicio. Los usuarios suscritos pueden acceder a un rango mayor.</p>
            </div>
        </div>
      </div>


      {/* Schedule */}
      <div className="space-y-4">
        <Label>Horarios de Atención</Label>
        <div className="space-y-3 rounded-md border p-4">
            {daysOfWeek.map(day => (
                 <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <Switch id={`switch-${day}`} />
                        <Label htmlFor={`switch-${day}`} className="w-24">{day}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input type="time" defaultValue="09:00" className="w-full sm:w-auto"/>
                        <span>-</span>
                        <Input type="time" defaultValue="17:00" className="w-full sm:w-auto"/>
                    </div>
                 </div>
            ))}
        </div>
      </div>

       {/* Social Media */}
      <div className="space-y-2">
        <Label htmlFor="website">Redes Sociales / Sitio Web</Label>
        <Input id="website" placeholder="https://tu-sitio-web.com" />
      </div>


      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext}>Siguiente</Button>
      </div>
    </div>
  );
}
