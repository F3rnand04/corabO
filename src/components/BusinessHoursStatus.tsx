
'use client';

import { useState, useEffect } from 'react';
import { getDay, format, parse, isWithinInterval, addDays, formatDistanceToNowStrict, differenceInMilliseconds } from 'date-fns';
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

const formatTimeDifference = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

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

        if (isWithinInterval(now, { start: fromTime, end: toTime })) {
          setStatus('open');
          const timeToClose = formatTimeDifference(differenceInMilliseconds(toTime, now));
          setMessage(`Cierra en ${timeToClose}`);
          if (onStatusChange) onStatusChange('open');
          return;
        }
      }

      // If closed, find next opening time
      for (let i = 0; i < 7; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        const nextDayName = dayMap[dayIndex];
        const nextDaySchedule = schedule[nextDayName];

        if (nextDaySchedule && nextDaySchedule.active) {
            const potentialOpening = parse(nextDaySchedule.from, 'HH:mm', addDays(now, i));
            // If we are looking at today but the time has passed
            if (i === 0 && now > potentialOpening) {
                continue; // Look for the next available day
            }
            
            setStatus('closed');
            const timeToOpen = formatDistanceToNowStrict(potentialOpening, { locale: es });
            const dayName = format(potentialOpening, 'eeee', { locale: es });
            setMessage(`Abre en ${timeToOpen} (${dayName})`);
            if (onStatusChange) onStatusChange('closed');
            return;
        }
      }
      
      // Default fallback if no schedule is found in the next 7 days
      setStatus('closed');
      setMessage('Cerrado temporalmente');
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
