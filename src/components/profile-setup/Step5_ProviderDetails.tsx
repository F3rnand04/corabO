
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { MapPin, Building, AlertCircle, Package, Hand, Star, Info, LocateFixed, Handshake, Wrench, Stethoscope, BadgeCheck, Truck, Utensils, Link as LinkIcon, Briefcase, BrainCircuit, Scissors } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionDialog } from '../SubscriptionDialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProfileSetupData } from '@/lib/types';
import { useState, useCallback } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

// --- Specialized Field Components ---

interface SpecializedFieldProps {
    formData: ProfileSetupData;
    onSpecializedChange: (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => void;
}

const GeneralProviderFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleAddSkill = (field: 'keySkills') => {
        const fieldData = formData.specializedData?.[field] || [];
        if (currentSkill && !fieldData.includes(currentSkill)) {
            onSpecializedChange(field, [...fieldData, currentSkill]);
            setCurrentSkill('');
        }
    };
    const handleRemoveSkill = (skillToRemove: string) => {
        const newSkills = (formData.specializedData?.keySkills || []).filter(s => s !== skillToRemove);
        onSpecializedChange('keySkills', newSkills);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="keySkills" className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Habilidades Clave</Label>
                <div className="flex gap-2">
                    <Input id="keySkills" placeholder="Ej: Desarrollo Web, Figma" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill('keySkills'); }}}/>
                    <Button onClick={() => handleAddSkill('keySkills')} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {formData.specializedData?.keySkills?.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}<button onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="toolsAndBrands" className="flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> Herramientas y Marcas</Label>
                <Textarea id="toolsAndBrands" placeholder="Ej: Adobe Photoshop, Wella, OPI" value={formData.specializedData?.toolsAndBrands || ''} onChange={(e) => onSpecializedChange('toolsAndBrands', e.target.value)} rows={2}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="yearsOfExperience" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Años de Experiencia</Label>
                <Input id="yearsOfExperience" type="number" placeholder="Ej: 5" value={formData.specializedData?.yearsOfExperience || ''} onChange={(e) => onSpecializedChange('yearsOfExperience', parseInt(e.target.value, 10) || 0)}/>
            </div>
        </div>
    );
};

const TransportFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="vehicleType" className="flex items-center gap-2"><Truck className="w-4 h-4"/> Tipo de Vehículo</Label>
            <Input id="vehicleType" placeholder="Ej: Camión 350, Grúa de Plataforma" value={formData?.specializedData?.vehicleType || ''} onChange={(e) => onSpecializedChange('vehicleType', e.target.value)}/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2"><Package className="w-4 h-4"/> Capacidad de Carga</Label>
            <Input id="capacity" placeholder="Ej: 3,500 Kg, 2 vehículos" value={formData?.specializedData?.capacity || ''} onChange={(e) => onSpecializedChange('capacity', e.target.value)}/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="specialConditions" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Equipos o Condiciones Especiales</Label>
            <Textarea id="specialConditions" placeholder="Ej: Rampa hidráulica, GPS, Cava refrigerada..." value={formData?.specializedData?.specialConditions || ''} onChange={(e) => onSpecializedChange('specialConditions', e.target.value)} rows={3}/>
        </div>
    </div>
);

const HealthFields = ({ formData, onSpecializedChange }: SpecializedFieldProps) => {
    const [currentSpecialty, setCurrentSpecialty] = useState('');
    const handleAddSpecialty = () => {
        const specialties = formData.specializedData?.specialties || [];
        if (currentSpecialty && !specialties.includes(currentSpecialty)) {
            onSpecializedChange('specialties', [...specialties, currentSpecialty]);
            setCurrentSpecialty('');
        }
    };
    const handleRemoveSpecialty = (specToRemove: string) => {
        const newSpecialties = (formData.specializedData?.specialties || []).filter(spec => spec !== specToRemove);
        onSpecializedChange('specialties', newSpecialties);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="flex items-center gap-2"><BadgeCheck className="w-4 h-4"/> Nro. Licencia / Colegiatura</Label>
                <Input id="licenseNumber" placeholder="Ej: MPPS 12345" value={formData?.specializedData?.licenseNumber || ''} onChange={(e) => onSpecializedChange('licenseNumber', e.target.value)}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="specialties" className="flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Especialidades</Label>
                <div className="flex gap-2">
                    <Input id="specialties" placeholder="Ej: Terapia Manual" value={currentSpecialty} onChange={(e) => setCurrentSpecialty(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); }}}/>
                    <Button onClick={handleAddSpecialty} type="button">Añadir</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {formData.specializedData?.specialties?.map(spec => (
                        <Badge key={spec} variant="secondary">{spec}<button onClick={() => handleRemoveSpecialty(spec)} className="ml-2 rounded-full hover:bg-background/50"><X className="h-3 w-3"/></button></Badge>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="consultationMode" className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Modalidad de Atención</Label>
                <Select value={formData?.specializedData?.consultationMode || ''} onValueChange={(value) => onSpecializedChange('consultationMode', value)}>
                    <SelectTrigger id="consultationMode"><SelectValue placeholder="Selecciona una modalidad" /></SelectTrigger>
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
};


interface Step5_ProviderDetailsProps {
  onBack: () => void;
  onNext: () => void;
  formData: ProfileSetupData;
  setFormData: (data: ProfileSetupData) => void;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Step5_ProviderDetails({ onBack, onNext, formData, setFormData }: Step5_ProviderDetailsProps) {
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const { currentUser, users, requestAffiliation } = useCorabo();
  const { toast } = useToast();

  const MAX_RADIUS_FREE = 10;
  const isOverFreeRadius = (formData.serviceRadius || 0) > MAX_RADIUS_FREE && !(currentUser?.isSubscribed);
  const isProfessional = formData.providerType === 'professional';

  const companies = users.filter(u => u.profileSetupData?.providerType === 'company');

  const handleFormDataChange = useCallback((field: keyof ProfileSetupData, value: any) => {
    setFormData({ ...formData, [field]: value });
  }, [formData, setFormData]);

  const handleScheduleChange = useCallback((day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    const currentSchedule = formData.schedule || {};
    const newSchedule = { ...currentSchedule, [day]: { ...(currentSchedule[day] || {}), [field]: value } };
    handleFormDataChange('schedule', newSchedule);
  }, [formData, handleFormDataChange]);
  
  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      setFormData(prev => ({
          ...prev,
          specializedData: {
              ...(prev.specializedData || {}),
              [field]: value
          }
      }));
  }, [setFormData]);

  const handleRequestAffiliation = async (companyId: string) => {
      if (!currentUser || !companyId) return;
      try {
          await requestAffiliation(currentUser.id, companyId);
          toast({
              title: "Solicitud Enviada",
              description: "Tu solicitud de afiliación ha sido enviada a la empresa."
          })
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Error al solicitar",
              description: error.message || "No se pudo enviar la solicitud."
          })
      }
  };

  const handleMapClick = () => {
    if (formData.location) {
        const [lat, lon] = formData.location.split(',').map(Number);
        if(!isNaN(lat) && !isNaN(lon)) {
             const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
             window.open(mapsUrl, '_blank');
        }
    } else {
        toast({
            title: "Ubicación no definida",
            description: "Por favor, ingresa una ubicación en el campo de texto primero."
        });
    }
  };

  const renderSpecializedFields = () => {
    const professionalServicesCategories = ['Tecnología y Soporte', 'Educación', 'Eventos'];
    if (professionalServicesCategories.includes(formData.primaryCategory || '') || formData.primaryCategory === 'Belleza') {
      return <GeneralProviderFields formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
    }

    switch (formData.primaryCategory) {
      case 'Transporte y Asistencia':
        return <TransportFields formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
      case 'Salud y Bienestar':
        return <HealthFields formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
      default:
        return <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">No hay detalles especializados para esta categoría aún.</div>;
    }
  };


  return (
    <>
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Paso 5: Detalles Específicos del Proveedor</h2>
      
      <div className="space-y-4">
        <Label htmlFor="specialty">Especialidad / Descripción corta</Label>
        <Textarea id="specialty" placeholder="Ej: Expertos en cocina italiana." rows={2} maxLength={30} value={formData.specialty || ''} onChange={(e) => handleFormDataChange('specialty', e.target.value)}/>
        <p className="text-xs text-muted-foreground text-right">{formData.specialty?.length || 0} / 30</p>
      </div>

      {renderSpecializedFields()}
       
      <div className="space-y-3 pt-6 border-t">
        <Label>Ofrezco principalmente</Label>
        <RadioGroup value={formData.offerType || 'service'} onValueChange={(value: 'product' | 'service') => handleFormDataChange('offerType', value)} className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="service" id="service" /><Label htmlFor="service" className="flex items-center gap-2 font-normal cursor-pointer"><Hand className="w-4 h-4"/> Servicios</Label></div>
             <div className="flex items-center space-x-2"><RadioGroupItem value="product" id="product" /><Label htmlFor="product" className="flex items-center gap-2 font-normal cursor-pointer"><Package className="w-4 h-4"/> Productos</Label></div>
        </RadioGroup>
      </div>

      {isProfessional && (
        <div className="space-y-3">
          <Label>Afiliación Profesional</Label>
          <div className="p-4 rounded-md border space-y-3">
            <p className="text-sm text-muted-foreground">Solicita la verificación de la empresa donde trabajas para aumentar tu confianza. La empresa deberá aprobar tu solicitud desde su panel.</p>
             <Select onValueChange={handleRequestAffiliation}>
                <SelectTrigger><SelectValue placeholder="Busca y selecciona una empresa..." /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {currentUser?.activeAffiliation && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Handshake className="h-4 w-4 !text-current" />
                    <AlertTitle className="font-bold">¡Ya estás afiliado!</AlertTitle>
                    <AlertDescription>Actualmente estas verificado por: <strong>{currentUser.activeAffiliation.companyName}</strong>.</AlertDescription>
                </Alert>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
          <Label>Opciones de Pago y Citas</Label>
           <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <Link href="/credicora" className="cursor-pointer group">
                  <Label htmlFor="accepts-credicora" className="flex items-center gap-2 font-medium text-blue-600 group-hover:underline"><Star className="w-5 h-5 fill-current"/>Aceptar Pagos con Credicora</Label>
                </Link>
                <Switch id="accepts-credicora" checked={formData.acceptsCredicora} onCheckedChange={(checked) => handleFormDataChange('acceptsCredicora', checked)}/>
            </div>
            {formData.acceptsCredicora && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 !text-current" />
                    <AlertTitle className="font-bold">¡Amplía tu Horizonte de Clientes con CrediCora!</AlertTitle>
                    <AlertDescription>Al aceptar pagos con CrediCora, no solo aseguras recibir tu dinero de forma segura, sino que abres las puertas a un universo de clientes que valoran la flexibilidad.</AlertDescription>
                </Alert>
            )}
            {formData.offerType === 'service' && (
              <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="appointment-cost">Costo por Consulta/Cita<span className="block text-xs text-muted-foreground">Dejar en 0 si es gratis o variable.</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="appointment-cost" type="number" className="w-28 pl-6" value={formData.appointmentCost || 0} onChange={(e) => handleFormDataChange('appointmentCost', parseFloat(e.target.value))}/>
                  </div>
              </div>
            )}
          </div>
      </div>
      
      <div className="space-y-4">
        <Label>Ubicación y Área de Cobertura</Label>
        <div className="space-y-4 rounded-md border p-4">
           <div className="flex items-center justify-between">
             <Label htmlFor="has-physical-location" className="flex items-center gap-2 font-medium"><Building className="w-5 h-5"/>Tengo un local físico</Label>
             <Switch id="has-physical-location" checked={formData.hasPhysicalLocation} onCheckedChange={(checked) => handleFormDataChange('hasPhysicalLocation', checked)}/>
           </div>
            <div className="relative">
                 <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleMapClick}><LocateFixed className="h-5 w-5" /></Button>
                <Input id="location" placeholder="Ubicación de tu negocio..." className="pl-12" value={formData.location || ''} onChange={(e) => handleFormDataChange('location', e.target.value)}/>
            </div>
            <div className="flex items-center justify-between">
                 <Label htmlFor="show-exact-location" className="flex items-center gap-2 font-medium">Mostrar ubicación exacta</Label>
                 <Switch id="show-exact-location" checked={formData.showExactLocation} onCheckedChange={(checked) => handleFormDataChange('showExactLocation', checked)}/>
            </div>
            {!formData.showExactLocation && (
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="service-radius">Radio de acción</Label>
                        <Badge variant={isOverFreeRadius ? "destructive" : "secondary"} className="font-mono">{formData.serviceRadius} km</Badge>
                    </div>
                    <Slider id="service-radius" min={5} max={100} step={5} value={[formData.serviceRadius || 5]} onValueChange={(value) => handleFormDataChange('serviceRadius', value[0])} className={cn(isOverFreeRadius && '[&_.bg-primary]:bg-destructive')}/>
                     {isOverFreeRadius ? (
                         <div className="flex items-center justify-center gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span className="flex-grow">¡Activa un plan para ampliar tu alcance y obtener la insignia de verificado!</span>
                            <Button size="sm" className="h-7 text-xs" variant="destructive" onClick={() => setIsSubscriptionDialogOpen(true)}>Suscribir</Button>
                         </div>
                     ) : (
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="only-delivery" className="flex items-center gap-2">Mi servicio es solo delivery</Label>
                            <Switch id="only-delivery" checked={formData.isOnlyDelivery} onCheckedChange={(checked) => handleFormDataChange('isOnlyDelivery', checked)}/>
                        </div>
                     )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Horarios de Atención</Label>
        <div className="space-y-3 rounded-md border p-4">
            {daysOfWeek.map(day => (
                 <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <Switch id={`switch-${day}`} checked={formData?.schedule?.[day]?.active ?? false} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} />
                        <Label htmlFor={`switch-${day}`} className="w-24">{day}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input type="time" value={formData?.schedule?.[day]?.from || '09:00'} onChange={(e) => handleScheduleChange(day, 'from', e.target.value)} className="w-full sm:w-auto"/>
                        <span>-</span>
                        <Input type="time" value={formData?.schedule?.[day]?.to || '17:00'} onChange={(e) => handleScheduleChange(day, 'to', e.target.value)} className="w-full sm:w-auto"/>
                    </div>
                 </div>
            ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={!formData.location?.trim()}>Siguiente</Button>
      </div>
    </div>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
