

'use client';

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Package, Save, Truck, Wrench, Stethoscope, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSetupData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';


export function ProfileDetailsTab() {
  const { currentUser, updateUser } = useCorabo();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileSetupData['specializedData']>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState('');

  useEffect(() => {
    if (currentUser?.profileSetupData?.specializedData) {
      setFormData(currentUser.profileSetupData.specializedData);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="flex items-center justify-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const handleInputChange = (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSpecialty = () => {
    if (currentSpecialty && !formData?.specialties?.includes(currentSpecialty)) {
        const newSpecialties = [...(formData.specialties || []), currentSpecialty];
        handleInputChange('specialties', newSpecialties);
        setCurrentSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    const newSpecialties = formData.specialties?.filter(spec => spec !== specToRemove);
    handleInputChange('specialties', newSpecialties);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
        await updateUser(currentUser.id, {
            profileSetupData: {
                ...currentUser.profileSetupData,
                specializedData: formData,
            }
        });
        toast({ title: "Detalles Guardados", description: "Tu información especializada ha sido actualizada." });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
        setIsLoading(false);
    }
  };

  const renderTransportFields = () => (
    <div className="space-y-4">
       <div className="space-y-2">
            <Label htmlFor="vehicleType" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Tipo de Vehículo</Label>
            <Input 
                id="vehicleType" 
                placeholder="Ej: Camión 350, Grúa de Plataforma" 
                value={formData?.vehicleType || ''}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2"><Package className="w-4 h-4"/> Capacidad de Carga</Label>
            <Input 
                id="capacity" 
                placeholder="Ej: 3,500 Kg, 2 vehículos" 
                value={formData?.capacity || ''}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
            />
        </div>
         <div className="space-y-2">
            <Label htmlFor="specialConditions" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Equipos o Condiciones Especiales</Label>
            <Textarea
                id="specialConditions"
                placeholder="Ej: Rampa hidráulica, GPS, Cava refrigerada..."
                value={formData?.specialConditions || ''}
                onChange={(e) => handleInputChange('specialConditions', e.target.value)}
                rows={3}
            />
        </div>
    </div>
  );

  const renderHealthFields = () => (
     <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="flex items-center gap-2"><BadgeCheck className="w-4 h-4"/> Nro. Licencia / Colegiatura</Label>
            <Input 
                id="licenseNumber" 
                placeholder="Ej: MPPS 12345"
                value={formData?.licenseNumber || ''}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            />
        </div>
         <div className="space-y-2">
            <Label htmlFor="specialties" className="flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Especialidades</Label>
            <div className="flex gap-2">
                <Input 
                    id="specialties" 
                    placeholder="Ej: Terapia Manual" 
                    value={currentSpecialty}
                    onChange={(e) => setCurrentSpecialty(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSpecialty();
                        }
                    }}
                />
                <Button onClick={handleAddSpecialty} type="button">Añadir</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
                {formData.specialties?.map(spec => (
                    <Badge key={spec} variant="secondary">
                        {spec}
                        <button onClick={() => handleRemoveSpecialty(spec)} className="ml-2 rounded-full hover:bg-background/50">
                            <X className="h-3 w-3"/>
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="consultationMode" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Modalidad de Atención</Label>
            <Select 
                value={formData?.consultationMode || ''}
                onValueChange={(value) => handleInputChange('consultationMode', value)}
            >
                <SelectTrigger id="consultationMode">
                    <SelectValue placeholder="Selecciona una modalidad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="office">En Consultorio</SelectItem>
                    <SelectItem value="home">A Domicilio</SelectItem>
                    <SelectItem value="online">En Línea</SelectItem>
                    <SelectItem value="hybrid">Híbrido (Online y Presencial)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (currentUser.profileSetupData?.primaryCategory) {
      case 'Transporte y Asistencia':
        return renderTransportFields();
      case 'Salud y Bienestar':
        return renderHealthFields();
      default:
        return (
            <Alert>
                <AlertTitle>Sección en Desarrollo</AlertTitle>
                <AlertDescription>
                    Próximamente añadiremos campos especializados para tu categoría. Por ahora, puedes usar tu descripción de perfil para detallar tus servicios.
                </AlertDescription>
            </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles Especializados</CardTitle>
        <CardDescription>
          Añade información técnica sobre tus servicios. Estos datos opcionales ayudan a los clientes a entender mejor tu oferta y generan más confianza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderContent()}
        <Button onClick={handleSave} disabled={isLoading} className="w-full mt-6">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
            Guardar Detalles
        </Button>
      </CardContent>
    </Card>
  );
}
