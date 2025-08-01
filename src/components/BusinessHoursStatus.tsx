
'use client';

import { useState, useEffect } from 'react';
import { differenceInMinutes, parse, getDay, addDays, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ProfileSetupData } from '@/lib/types';

interface BusinessHoursStatusProps {
  schedule?: ProfileSetupData['schedule'];
  onStatusChange?: (status: 'open' | 'closed') => void;
}

const dayMap: { [key: number]: string } = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
};

export function BusinessHoursStatus({ schedule, onStatusChange }: BusinessHoursStatusProps) {
  const [status, setStatus] = useState<'open' | 'closed'>('closed');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkStatus = () => {
      if (!schedule) {
        setStatus('closed');
        setMessage('Horario no disponible');
        if (onStatusChange) onStatusChange('closed');
        return;
      }

      const now = new Date();
      const currentDayIndex = getDay(now);
      const currentDayName = dayMap[currentDayIndex];
      const todaySchedule = schedule[currentDayName];

      if (todaySchedule && todaySchedule.active) {
        const fromTime = parse(todaySchedule.from, 'HH:mm', now);
        const toTime = parse(todaySchedule.to, 'HH:mm', now);

        if (now >= fromTime && now <= toTime) {
          setStatus('open');
          const timeToClose = formatDistanceToNowStrict(toTime, { locale: es, unit: 'minute' });
          setMessage(`Cierra en ${timeToClose}`);
          if (onStatusChange) onStatusChange('open');
          return;
        }
      }

      // If closed, find next opening time
      let nextOpeningTime: Date | null = null;
      for (let i = 0; i < 7; i++) {
        const checkDayIndex = (currentDayIndex + i) % 7;
        const checkDayName = dayMap[checkDayIndex];
        const daySchedule = schedule[checkDayName];
        
        if (daySchedule && daySchedule.active) {
          const openingTimeToday = parse(daySchedule.from, 'HH:mm', addDays(now, i));
          if (now < openingTimeToday) {
            nextOpeningTime = openingTimeToday;
            break;
          }
        }
      }
      
      setStatus('closed');
      if (nextOpeningTime) {
         const timeToOpen = formatDistanceToNowStrict(nextOpeningTime, { locale: es });
         const dayName = format(nextOpeningTime, 'eeee', { locale: es });
         setMessage(`Abre en ${timeToOpen} (${dayName})`);
      } else {
        setMessage('Cerrado temporalmente');
      }
      if (onStatusChange) onStatusChange('closed');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [schedule, onStatusChange]);

  return (
    <div className="flex items-center gap-2 text-xs font-semibold">
      <span className={cn("w-2 h-2 rounded-full", status === 'open' ? 'bg-green-500' : 'bg-red-500')} />
      <span className={cn(status === 'open' ? 'text-green-600' : 'text-red-600')}>
        {status === 'open' ? 'Abierto' : 'Cerrado'}
      </span>
      <span className="text-muted-foreground font-normal">· {message}</span>
    </div>
  );
}
