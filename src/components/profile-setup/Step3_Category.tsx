'use client';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import type { ProfileSetupData } from '@/lib/types';


interface Step3_CategoryProps {
  onBack: () => void;
  onNext: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
}

const allCategories = [
  { id: 'Hogar y Reparaciones', name: 'Hogar y Reparaciones', description: 'Plomería, electricidad, jardinería...' },
  { id: 'Tecnología y Soporte', name: 'Tecnología y Soporte', description: 'Reparación de PC, redes, diseño...' },
  { id: 'Automotriz y Repuestos', name: 'Automotriz y Repuestos', description: 'Mecánica, repuestos, latonería...' },
  { id: 'Alimentos y Restaurantes', name: 'Alimentos y Restaurantes', description: 'Restaurantes, catering, mercados...' },
  { id: 'Transporte y Asistencia', name: 'Transporte y Asistencia', description: 'Grúas, ambulancias, fletes, mudanzas...' },
  { id: 'Salud y Bienestar', name: 'Salud y Bienestar', description: 'Fisioterapia, nutrición, entrenadores...' },
  { id: 'Educación', name: 'Educación', description: 'Tutorías, clases, cursos...' },
  { id: 'Eventos', name: 'Eventos', description: 'Fotografía, catering, música...' },
  { id: 'Belleza', name: 'Belleza', description: 'Peluquería, maquillaje, spa...' },
];

export default function Step3_Category({ onBack, onNext, formData, setFormData }: Step3_CategoryProps) {
    const selectedCategories = formData.categories || [];
    const primaryCategory = formData.primaryCategory;

    const handleCategoryToggle = (categoryId: string) => {
        const newSelected = selectedCategories.includes(categoryId)
            ? selectedCategories.filter(c => c !== categoryId)
            : [...selectedCategories, categoryId];
        
        let newPrimary = primaryCategory;
        if (newSelected.length === 1) {
            newPrimary = newSelected[0];
        } else if (!newSelected.includes(primaryCategory || '')) {
            newPrimary = null;
        }

        setFormData({ ...formData, categories: newSelected, primaryCategory: newPrimary });
    };

    const handlePrimaryCategorySelect = (categoryId: string) => {
        // When primary category changes, clear specialized data to avoid inconsistencies
        const { specializedData, ...restOfData } = formData;
        setFormData({ ...restOfData, primaryCategory: categoryId });
    }
    

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 3: Elige tus categorías de servicio</h2>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Selecciona una o más áreas de especialización. Si seleccionas varias, puedes indicar cuál es tu categoría principal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allCategories.map((category) => (
                <div key={category.id} className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
                    <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                        <Label htmlFor={category.id} className="font-semibold cursor-pointer">
                           {category.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ejemplos para {category.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ))}
        </div>
      </div>
      
       {selectedCategories.length > 1 && (
        <div className="space-y-3">
          <Label>Indica tu categoría principal (esto definirá los campos especializados)</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((catId) => {
              const category = allCategories.find(c => c.id === catId);
              if (!category) return null;
              return (
                <Button 
                    key={catId}
                    variant={primaryCategory === catId ? 'default' : 'outline'}
                    onClick={() => handlePrimaryCategorySelect(catId)}
                >
                    {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}


      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={selectedCategories.length === 0}>Siguiente</Button>
      </div>
    </div>
  );
}
