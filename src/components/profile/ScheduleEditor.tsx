

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { BusinessHoursStatus } from '../BusinessHoursStatus';
import type { User, ProfileSetupData } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { ChevronDown, Clock, Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { updateUser } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';

interface ScheduleEditorProps {
  provider: User;
  isSelfProfile: boolean;
}

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const defaultSchedule = weekDays.reduce((acc, day) => {
    acc[day] = { from: '09:00', to: '17:00', active: true };
    return acc;
}, {} as NonNullable<ProfileSetupData['schedule']>);


export function ScheduleEditor({ provider, isSelfProfile }: ScheduleEditorProps) {
    const [schedule, setSchedule] = useState(provider.profileSetupData?.schedule || defaultSchedule);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleScheduleChange = (day: string, field: 'from' | 'to' | 'active', value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUser(provider.id, { 'profileSetupData.schedule': schedule });
            toast({ title: 'Horario actualizado', description: 'Tus nuevos horarios de atención están visibles.' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el horario.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isSelfProfile) {
        return (
             <Card className="bg-muted/30">
                <CardHeader>
                    <BusinessHoursStatus schedule={provider.profileSetupData?.schedule} />
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="bg-muted/30">
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer">
                        <BusinessHoursStatus schedule={schedule} />
                        <Button variant="ghost" size="sm">
                            Editar
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {weekDays.map(day => (
                                <div key={day} className="flex items-center gap-4 p-2 rounded-md bg-background border">
                                    <Switch
                                        id={`active-${day}`}
                                        checked={schedule[day]?.active || false}
                                        onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)}
                                    />
                                    <Label htmlFor={`active-${day}`} className="flex-grow font-semibold">{day}</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            className="w-24 h-8"
                                            value={schedule[day]?.from || '09:00'}
                                            onChange={(e) => handleScheduleChange(day, 'from', e.target.value)}
                                            disabled={!schedule[day]?.active}
                                        />
                                        <span>-</span>
                                        <Input
                                            type="time"
                                            className="w-24 h-8"
                                            value={schedule[day]?.to || '17:00'}
                                            onChange={(e) => handleScheduleChange(day, 'to', e.target.value)}
                                            disabled={!schedule[day]?.active}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-4" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
