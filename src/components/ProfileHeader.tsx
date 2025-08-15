'use client';

import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Megaphone, Zap, Plus, Package, Wallet, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter, usePathname } from 'next/navigation';
import { CampaignDialog } from '@/components/CampaignDialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import type { Transaction } from '@/lib/types';
import { SubscriptionDialog } from './SubscriptionDialog';


export function ProfileHeader() {
  const { toast } = useToast();
  const { currentUser, updateUserProfileImage, getUserMetrics, transactions, getAgendaEvents, toggleGps, allPublications } = useCorabo();
  
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  if (!currentUser) return null;

  const isProvider = currentUser.type === 'provider';
  
  const { reputation, effectiveness, responseTime } = getUserMetrics(currentUser.id, transactions);
  const isNewProvider = responseTime === 'Nuevo';
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const newImageUrl = reader.result as string;
            await updateUserProfileImage(currentUser.id, newImageUrl);
             toast({
                title: "¡Foto de Perfil Actualizada!",
                description: "Tu nueva foto de perfil está visible.",
            });
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const displayName = currentUser.profileSetupData?.useUsername 
    ? (currentUser.profileSetupData.username || currentUser.name)
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';

  const galleryCount = allPublications.filter(p => p.providerId === currentUser.id && p.type !== 'product').length;
  const productCount = allPublications.filter(p => p.providerId === currentUser.id && p.type === 'product').length;

  const agendaEvents = getAgendaEvents(transactions);
  const eventDates = agendaEvents.map(e => e.date);

  const handleDayClick = (day: Date) => {
    const eventOnDay = agendaEvents.find(e => format(e.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    if(eventOnDay) {
        const tx = transactions.find(t => t.id === eventOnDay.transactionId);
        if(tx) setSelectedTransaction(tx);
    }
  }


  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-2">
         <div className="flex items-center space-x-4">
            <div className="relative shrink-0">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <Avatar className="w-16 h-16 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button size="icon" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full" onClick={handleAvatarClick}>
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <div className="flex-grow">
                <h1 className="text-lg font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{specialty}</p>
                <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                        <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
                    </div>
                    {isNewProvider ? (
                        <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
                    ) : (
                    <>
                        <div className="w-px h-3 bg-border mx-1"></div>
                        <span>{effectiveness.toFixed(0)}% Efec.</span>
                    </>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                {!currentUser.isSubscribed && (
                     <Button variant="link" size="sm" className="p-0 h-auto text-red-500 hover:text-red-600 font-semibold text-xs" onClick={() => setIsSubscriptionDialogOpen(true)}>
                        Suscribir
                    </Button>
                )}
                 <div className="flex items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground">
                                <CalendarIcon className="w-5 h-5"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="multiple"
                                selected={eventDates}
                                onDayClick={handleDayClick}
                            />
                            <div className="p-2 border-t text-center text-xs text-muted-foreground">
                                Días con eventos están resaltados.
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button asChild variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground">
                        <Link href="/transactions">
                            <Wallet className="w-5 h-5"/>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => toggleGps(currentUser.id)}>
                        <MapPin className={cn("w-5 h-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")}/>
                    </Button>
                 </div>
            </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
            {isProvider && (
                <Button variant="outline" className="flex-1" onClick={() => setIsCampaignDialogOpen(true)}>
                    <Megaphone className="w-4 h-4 mr-2"/>
                    Gestionar Campañas
                </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
                <Link href="/emprende">
                    <Zap className="w-4 h-4 mr-2"/>
                    Emprende por Hoy
                </Link>
            </Button>
        </div>
        
        <div className="flex justify-around font-semibold text-center border-b mt-4">
            <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={pathname === '/profile/publications'}>
               <Link href="/profile/publications">{`Publicaciones ${galleryCount}`}</Link>
            </Button>
            {isProvider && currentUser.profileSetupData?.offerType !== 'service' && (
                <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={pathname === '/profile/catalog'}>
                    <Link href="/profile/catalog">{`Catálogo ${productCount}`}</Link>
                </Button>
            )}
        </div>
      </header>
      {isProvider && <CampaignDialog isOpen={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen} />}
      <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
      <TransactionDetailsDialog 
        isOpen={!!selectedTransaction}
        onOpenChange={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
       />
    </>
  );
}
