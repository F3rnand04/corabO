

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, User, ShieldCheck } from "lucide-react";
import type { ProfileSetupData } from '@/lib/types';
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Step5_ReviewProps {
  formData: Partial<ProfileSetupData>;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const placeholderMap: Record<string, { skills: string; certifications: string }> = {
    'delivery': {
      skills: 'Ej: Licencia de 2da, Certificado Médico Vial',
      certifications: 'Ej: Curso de Manejo Defensivo',
    },
    'Salud y Bienestar': {
      skills: 'Ej: Terapia manual, Punción seca, Masaje deportivo',
      certifications: 'Ej: Certificado en Fisioterapia Deportiva',
    },
    'Hogar y Reparaciones': {
      skills: 'Ej: Instalación de tuberías PVC, Detección de fugas',
      certifications: 'Ej: Certificado de Gas Nivel 2, Trabajo en Alturas',
    },
    'Automotriz y Repuestos': {
      skills: 'Ej: Diagnóstico con escáner, Rectificación de motores',
      certifications: 'Ej: Certificado en Sistemas de Inyección Electrónica',
    },
    'Alimentos y Restaurantes': {
      skills: 'Ej: Cocina al vacío, Repostería francesa, Catering',
      certifications: 'Ej: Certificado de Manipulación de Alimentos',
    },
    'Belleza': {
      skills: 'Ej: Balayage, Uñas acrílicas, Maquillaje de novia',
      certifications: 'Ej: Certificado de Colorimetría Avanzada',
    },
    'default': {
      skills: 'Ej: Habilidad 1, Habilidad 2, Habilidad 3',
      certifications: 'Ej: Certificado en...',
    },
};

const EditableTextareaItem = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (value: string) => void, placeholder?: string }) => (
    <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
    </div>
);

export default function Step5_Review({ formData, onUpdate, onSubmit, isSubmitting }: Step5_ReviewProps) {
  const { currentUser } = useAuth();

  const placeholders = useMemo(() => {
    const isDelivery = formData.providerType === 'delivery';
    const categoryKey = isDelivery ? 'delivery' : (formData.primaryCategory || 'default');
    return placeholderMap[categoryKey] || placeholderMap.default;
  }, [formData.providerType, formData.primaryCategory]);
  
  const handleSpecializedDataChange = (field: keyof NonNullable<ProfileSetupData['specializedData']>, value: any) => {
      onUpdate({
          ...formData,
          specializedData: {
              ...(formData.specializedData || {}),
              [field]: value,
          },
      });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Paso 5: Revisión y Confirmación</h2>
        <p className="text-sm text-muted-foreground">
          Verifica y edita por última vez tu información. Al confirmar, tu perfil de proveedor se activará.
        </p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Edit className="w-5 h-5"/> Edita tu Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="text-sm text-muted-foreground pt-2">
                <p>Usuario Público: <span className="font-semibold text-foreground">{formData.username}</span></p>
                <p>Especialidad: <span className="font-semibold text-foreground">{formData.specialty}</span></p>
                <p>Categoría: <span className="font-semibold text-foreground">{formData.primaryCategory}</span></p>
                <p>Tipo de Oferta: <span className="font-semibold text-foreground">{formData.offerType}</span></p>
             </div>
             <Separator/>
             <EditableTextareaItem 
                label="Habilidades o Servicios (separados por comas)"
                value={(formData.specializedData?.specificSkills || []).join(', ')}
                onChange={(value) => handleSpecializedDataChange('specificSkills', value.split(',').map(s => s.trim()))}
                placeholder={placeholders.skills}
             />
             <EditableTextareaItem 
                label="Certificaciones (separados por comas)"
                value={formData.specializedData?.certifications || ''}
                onChange={(value) => handleSpecializedDataChange('certifications', value)}
                placeholder={placeholders.certifications}
             />
        </CardContent>
      </Card>
      
       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> Representante Legal</CardTitle>
                 <CardDescription>Como proveedor individual, tú eres tu propio representante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm">
                    <p className="text-muted-foreground">Nombre:</p>
                    <p className="font-semibold">{`${currentUser?.name || ''} ${currentUser?.lastName || ''}`.trim()}</p>
                </div>
                <div className="text-sm">
                    <p className="text-muted-foreground">ID:</p>
                    <p className="font-semibold">{currentUser?.idNumber || 'No especificado'}</p>
                </div>
                <div className="text-sm">
                    <p className="text-muted-foreground">Teléfono:</p>
                    <p className="font-semibold">{currentUser?.phone || 'No especificado'}</p>
                </div>
            </CardContent>
        </Card>

      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Confirmar y Convertirme en Proveedor'}
      </Button>
    </div>
  );
}
