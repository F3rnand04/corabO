
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Truck, Star, Clock } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import type { ProfileSetupData } from '@/lib/types';
import { SpecializedFields } from '@/components/profile-setup/SpecializedFields';
import { useAuth } from '@/hooks/use-auth-provider';

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function LogisticsPage() {
    const { currentUser, setCurrentUser } = useAuth();
    const router = useRouter();
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

    if (!currentUser) return null;

    const formData = currentUser.profileSetupData || {};
    
    const onUpdate = (data: Partial<ProfileSetupData>) => {
      setCurrentUser(prev => prev ? { ...prev, profileSetupData: { ...(prev.profileSetupData || {}), ...data } } : null);
    };

    const showSubscriptionIncentive = (formData.serviceRadius || 0) > 10 && !currentUser.isSubscribed;

    const handleScheduleChange = (day: string, field: 'active' | 'hours', value: boolean | number[]) => {
      const currentSchedule = formData.schedule || {};
      const daySchedule = currentSchedule[day] || { from: '09:00', to: '17:00', active: false };
  
      let newDaySchedule;
      if (field === 'active') {
          newDaySchedule = { ...daySchedule, active: value as boolean };
      } else {
          const [fromHour, toHour] = value as number[];
          newDaySchedule = { ...daySchedule, from: `${String(fromHour).padStart(2, '0')}:00`, to: `${String(toHour).padStart(2, '0')}:00` };
      }
  
      onUpdate({ schedule: { ...currentSchedule, [day]: newDaySchedule } });
    };

    return (
        <>
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Paso 4: Logística del Servicio</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5"/>Ubicación y Alcance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación de Referencia</Label>
                        <div className="flex items-center gap-2">
                             <Input id="location" value={formData.location || ''} placeholder="Establece tu ubicación en el mapa" readOnly className="cursor-pointer" onClick={() => router.push('/map?fromProfile=true')} />
                             <Button variant="outline" size="icon" onClick={() => router.push('/map?fromProfile=true')}>
                                <MapPin className="w-4 h-4"/>
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground">Esta será tu ubicación base para calcular distancias y visibilidad.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="has_physical_location" checked={formData.hasPhysicalLocation} onCheckedChange={(checked) => onUpdate({ hasPhysicalLocation: !!checked })} />
                        <Label htmlFor="has_physical_location" className="font-normal">Tengo una tienda o local físico</Label>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="show_exact" className="text-sm font-normal">Mostrar ubicación exacta a clientes</Label>
                        <Switch id="show_exact" checked={formData.showExactLocation} onCheckedChange={(checked) => onUpdate({ showExactLocation: checked })} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <Label htmlFor="has_delivery" className="flex items-center gap-2 font-normal"><Truck className="w-4 h-4"/> Ofrezco solo Delivery / Servicio a Domicilio</Label>
                        <Switch id="has_delivery" checked={formData.isOnlyDelivery} onCheckedChange={(checked) => onUpdate({ isOnlyDelivery: !!checked })}/>
                    </div>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="radius">Radio de visibilidad de tu perfil (km)</Label>
                            <span className="font-bold text-sm">{formData.serviceRadius || 0} km</span>
                        </div>
                        <Slider 
                            id="radius" 
                            min={1} 
                            max={50} 
                            step={1} 
                            value={[formData.serviceRadius || 1]}
                            onValueChange={(value) => onUpdate({ serviceRadius: value[0] })}
                        />
                        {showSubscriptionIncentive && (
                           <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3"/>
                                Para un radio mayor a 10km,{' '}
                                <button type="button" onClick={() => setIsSubscriptionDialogOpen(true)} className="text-primary underline hover:no-underline font-semibold">
                                    suscríbete
                                </button>
                                {' '}y obtén alcance ilimitado.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/>Horario Laboral</CardTitle>
                    <CardDescription>Define tus horas de atención o disponibilidad para servicios.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-3">
                        {daysOfWeek.map(day => {
                            const daySchedule = formData?.schedule?.[day] || { from: '09:00', to: '17:00', active: false };
                            const isActive = daySchedule.active;
                            const [fromHour, toHour] = daySchedule.from && daySchedule.to 
                            ? [parseInt(daySchedule.from.split(':')[0], 10), parseInt(daySchedule.to.split(':')[0], 10)]
                            : [9, 17];
                            
                            return (
                            <div key={day} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`switch-${day}`} className="text-sm font-medium">{day}</Label>
                                    <Switch id={`switch-${day}`} checked={isActive} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} />
                                </div>
                                {isActive && (
                                    <div className="pl-2">
                                        <Slider defaultValue={[fromHour, toHour]} min={0} max={24} step={1} onValueChange={(value) => handleScheduleChange(day, 'hours', value)} />
                                        <p className="text-right text-xs font-mono text-muted-foreground mt-1">{`${String(fromHour).padStart(2, '0')}:00 - ${String(toHour).padStart(2, '0')}:00`}</p>
                                    </div>
                                )}
                            </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            
            <Button onClick={() => router.push('/profile-setup/personal/review')} className="w-full">
                Continuar
            </Button>
        </div>
        <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
        </>
    );
}
