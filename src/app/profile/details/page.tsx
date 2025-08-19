
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2, Settings, ChevronLeft, Save, Wrench, Clock, DollarSign, AlertCircle, Building, User, BadgeInfo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import * as SpecializedFields from '@/components/profile/specialized-fields';
import type { ProfileSetupData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { allCategories } from '@/lib/data/options';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const categoryComponentMap: { [key: string]: React.ElementType } = {
    'Transporte y Asistencia': SpecializedFields.TransportFields,
    'Salud y Bienestar': SpecializedFields.HealthFields,
    'Hogar y Reparaciones': SpecializedFields.HomeRepairFields,
    'Alimentos y Restaurantes': SpecializedFields.FoodAndRestaurantFields,
    'Belleza': SpecializedFields.BeautyFields,
    'Automotriz y Repuestos': SpecializedFields.AutomotiveFields,
    'Tecnología y Soporte': SpecializedFields.GeneralProviderFields,
    'Educación': SpecializedFields.GeneralProviderFields,
    'Eventos': SpecializedFields.GeneralProviderFields,
};

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function DetailsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold ml-4 flex items-center gap-2">
                        <Settings className="w-5 h-5"/>
                        Editar Detalles del Perfil
                    </h1>
                </div>
            </div>
        </header>
    );
}

export default function DetailsPage() {
  const { currentUser, updateFullProfile } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileSetupData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.profileSetupData) {
      setFormData(currentUser.profileSetupData);
    }
  }, [currentUser]);

  const handleInputChange = (field: keyof ProfileSetupData, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleLegalRepChange = (field: keyof NonNullable<ProfileSetupData['legalRepresentative']>, value: any) => {
      setFormData(prev => prev ? ({
          ...prev,
          legalRepresentative: {
              ...(prev.legalRepresentative || { name: '', idNumber: '', phone: '' }),
              [field]: value
          }
      }) : null);
  };

  const handleSpecializedInputChange = useCallback((field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      setFormData(prev => prev ? ({
          ...prev,
          specializedData: {
              ...(prev.specializedData || {}),
              [field]: value
          }
      }) : null);
  }, []);
  
  const handleScheduleChange = useCallback((day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
    setFormData(prev => {
        if (!prev) return null;
        const currentSchedule = prev.schedule || {};
        const newSchedule = { ...currentSchedule, [day]: { ...(currentSchedule[day] || {}), [field]: value } };
        return { ...prev, schedule: newSchedule };
    });
  }, []);

  const handleSaveChanges = async () => {
    if (!currentUser || !formData) return;
    setIsSaving(true);
    try {
        await updateFullProfile(currentUser.id, formData, currentUser.type);
        toast({ title: "Perfil Actualizado", description: "Tus detalles han sido guardados." });
        router.push('/profile');
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
        setIsSaving(false);
    }
  };

  const renderSpecializedFields = () => {
    if (!formData) return null;
    const category = formData.primaryCategory;
    if (!category) {
        return (
             <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Para añadir detalles, primero selecciona una categoría principal.
            </div>
        );
    }
    const SpecializedComponent = categoryComponentMap[category] || SpecializedFields.GeneralProviderFields;
    return <SpecializedComponent formData={formData} onSpecializedChange={handleSpecializedInputChange} />;
  };

  if (!currentUser || formData === null) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    );
  }
  
  const isCompany = currentUser.profileSetupData?.providerType === 'company';

  return (
     <>
      <DetailsHeader />
      <main className="container max-w-4xl mx-auto py-8">
         <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['general-details', 'specialized-fields', 'legal-info']} className="w-full space-y-4">
              <AccordionItem value="general-details" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Detalles del Perfil Público</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="space-y-4 pt-4 border-t">
                          {isCompany && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="username">Nombre Comercial (Opcional)</Label>
                                <Input id="username" placeholder="Ej: Super Pollo" value={formData.username || ''} onChange={(e) => handleInputChange('username', e.target.value)} />
                              </div>
                              <RadioGroup
                                  value={formData.useUsername ? 'username' : 'legal_name'}
                                  onValueChange={(value) => handleInputChange('useUsername', value === 'username')}
                                >
                                  <div className="flex items-center space-x-2"><RadioGroupItem value="legal_name" id="r1" /><Label htmlFor="r1">Mostrar Razón Social ({currentUser.name})</Label></div>
                                  <div className="flex items-center space-x-2"><RadioGroupItem value="username" id="r2" disabled={!formData.username} /><Label htmlFor="r2">Mostrar Nombre Comercial</Label></div>
                                </RadioGroup>
                                <hr/>
                            </>
                          )}
                          <div className="space-y-2">
                              <Label htmlFor="primaryCategory">Categoría Principal</Label>
                              <select
                                  id="primaryCategory"
                                  value={formData.primaryCategory || ''}
                                  onChange={(e) => handleInputChange('primaryCategory', e.target.value)}
                                  className="w-full p-2 border rounded-md"
                              >
                                  <option value="" disabled>Selecciona tu categoría principal</option>
                                  {allCategories.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="specialty">Especialidad / Descripción corta (máx. 30 caracteres)</Label>
                              <Textarea id="specialty" placeholder="Ej: Expertos en cocina italiana." rows={2} maxLength={30} value={formData.specialty || ''} onChange={(e) => handleInputChange('specialty', e.target.value)}/>
                          </div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
              
              {isCompany && (
                  <AccordionItem value="legal-info" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                              <Building className="w-5 h-5 text-primary"/>
                              <span className="font-semibold">Información Legal</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                           <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                  <Label htmlFor="legalRepName">Nombre del Representante Legal</Label>
                                  <Input id="legalRepName" placeholder="Nombre completo" value={formData.legalRepresentative?.name || ''} onChange={(e) => handleLegalRepChange('name', e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="legalRepId">Cédula/ID del Representante</Label>
                                  <Input id="legalRepId" placeholder="V-12345678" value={formData.legalRepresentative?.idNumber || ''} onChange={(e) => handleLegalRepChange('idNumber', e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="legalRepPhone">Teléfono del Representante</Label>
                                  <Input id="legalRepPhone" type="tel" placeholder="0412-1234567" value={formData.legalRepresentative?.phone || ''} onChange={(e) => handleLegalRepChange('phone', e.target.value)}/>
                                </div>
                           </div>
                      </AccordionContent>
                  </AccordionItem>
              )}

              <AccordionItem value="specialized-fields" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Wrench className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Campos Especializados</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="pt-4 border-t">
                          {renderSpecializedFields()}
                      </div>
                  </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="schedule" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Horarios de Atención</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="space-y-3 pt-4 border-t">
                          {daysOfWeek.map(day => (
                              <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between">
                                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
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
                  </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-details" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-primary"/>
                          <span className="font-semibold">Configuración Adicional</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="space-y-4 pt-4 border-t">
                          <div className="space-y-2">
                              <Label htmlFor="appointmentCost">Costo de Consulta / Presupuesto (USD)</Label>
                              <Input id="appointmentCost" type="number" placeholder="Ej: 20" value={formData.appointmentCost || ''} onChange={(e) => handleInputChange('appointmentCost', e.target.value ? parseFloat(e.target.value) : undefined)}/>
                              <p className="text-xs text-muted-foreground">Déjalo en blanco si no aplica o es gratuito.</p>
                          </div>
                          <div className="flex items-center space-x-2">
                              <Checkbox id="accepts-credicora" checked={formData.acceptsCredicora} onCheckedChange={(checked) => handleInputChange('acceptsCredicora', !!checked)} />
                              <Label htmlFor="accepts-credicora" className="font-medium">Acepto Credicora en mis ventas</Label>
                          </div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
             <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>¡Asegúrate de guardar!</AlertTitle>
                  <AlertDescription>
                   Cualquier cambio que realices en estos formularios no se aplicará hasta que hagas clic en el botón "Guardar Cambios".
                  </AlertDescription>
              </Alert>
            <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full mt-6" size="lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                Guardar Cambios
            </Button>
          </div>
      </main>
    </>
  );
}
