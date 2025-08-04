
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
        onStatusChange?.('closed');
        return;
      }

      const now = new Date();
      const currentDayIndex = getDay(now);
      const currentDayName = dayMap[currentDayIndex];
      const todaySchedule = schedule[currentDayName];

      if (todaySchedule && todaySchedule.active) {
        // We must parse the times in the context of the *current* date to handle intervals correctly.
        const fromTime = parse(todaySchedule.from, 'HH:mm', new Date());
        const toTime = parse(todaySchedule.to, 'HH:mm', new Date());

        if (isWithinInterval(now, { start: fromTime, end: toTime })) {
          setStatus('open');
          const timeToClose = formatTimeDifference(differenceInMilliseconds(toTime, now));
          setMessage(`Cierra en ${timeToClose}`);
          onStatusChange?.('open');
          return;
        }
      }

      // If closed, find next opening time
      for (let i = 0; i < 7; i++) {
        const nextDayDate = addDays(now, i);
        const nextDayIndex = getDay(nextDayDate);
        const nextDayName = dayMap[nextDayIndex];
        const nextDaySchedule = schedule[nextDayName];

        if (nextDaySchedule && nextDaySchedule.active) {
          const openingTimeToday = parse(nextDaySchedule.from, 'HH:mm', new Date());

          // If we are looking at today, but the opening time has already passed
          if (i === 0 && now > openingTimeToday) {
            continue; // Skip to the next day
          }
          
          const nextOpeningDate = parse(nextDaySchedule.from, 'HH:mm', nextDayDate);
          
          setStatus('closed');
          const timeToOpen = formatDistanceToNowStrict(nextOpeningDate, { locale: es, unit: 'hour' });
          const dayName = i === 1 ? 'mañana' : format(nextOpeningDate, 'eeee', { locale: es });
          const timeFormatted = format(nextOpeningDate, 'p', { locale: es });

          setMessage(`Abre ${dayName} a la(s) ${timeFormatted}`);
          onStatusChange?.('closed');
          return;
        }
      }
      
      // Default fallback if no schedule is found in the next 7 days
      setStatus('closed');
      setMessage('Cerrado temporalmente');
      onStatusChange?.('closed');
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
