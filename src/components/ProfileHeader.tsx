

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
import { useRouter } from 'next/navigation';
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
  const { currentUser, updateUserProfileImage, getUserMetrics, transactions, getAgendaEvents, toggleGps } = useCorabo();
  
  const router = useRouter();
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
  
  const handlePromotionClick = () => {
    if (!currentUser.isTransactionsActive) {
      toast({
        variant: "destructive",
        title: "Registro de Transacciones Inactivo",
        description: "Debes activar tu registro de transacciones para poder usar las promociones."
      });
      return;
    }
    router.push('/emprende');
  };

  const handleCampaignClick = () => {
     if (!currentUser.isTransactionsActive) {
      toast({
        variant: "destructive",
        title: "Registro de Transacciones Inactivo",
        description: "Debes activar tu registro para poder gestionar campañas."
      });
      return;
    }
    setIsCampaignDialogOpen(true);
  }
  
  const displayName = currentUser.profileSetupData?.useUsername 
    ? currentUser.profileSetupData.username || currentUser.name 
    : currentUser.name;
  const specialty = currentUser.profileSetupData?.specialty || 'Sin especialidad';

  const galleryCount = currentUser.gallery?.filter(p => p.type !== 'product').length || 0;
  const productCount = currentUser.gallery?.filter(p => p.type === 'product').length || 0;

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
                <div className="w-px h-3 bg-border mx-1"></div>
                {isNewProvider ? (
                    <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
                ) : (
                   <>
                     <span>{effectiveness.toFixed(0)}% Efec.</span>
                     <div className="w-px h-3 bg-border mx-1"></div>
                     <span className="font-semibold text-green-600">{responseTime}</span>
                   </>
                )}
            </div>
          </div>
        </div>
        
        <Card className="mt-4">
            <CardContent className="p-2 flex flex-col gap-2">
                 {!currentUser.isSubscribed && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-red-500/80 hover:text-red-500 text-xs" onClick={() => setIsSubscriptionDialogOpen(true)}>
                        Suscribir
                    </Button>
                 )}
                 <div className="flex justify-end gap-2">
                     <Popover>
                        <PopoverTrigger asChild>
                             <Button variant="outline" className="flex-1 rounded-full text-xs h-8 px-4 font-bold">
                                <CalendarIcon className="w-4 h-4 mr-2 text-blue-500"/>Agenda
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
                     <Button variant="outline" asChild className="flex-1 rounded-full text-xs h-8 px-4 font-bold">
                        <Link href="/transactions">
                            <Wallet className="w-4 h-4 mr-2 text-green-500"/>Registro
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={() => toggleGps(currentUser.id)}>
                        <MapPin className={cn("w-4 h-4 mr-2", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")}/>GPS
                    </Button>
                 </div>
                 <div className="flex justify-end gap-2">
                    {isProvider && <Button variant="secondary" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handleCampaignClick}><Megaphone className="w-4 h-4 mr-2 text-purple-500"/>Gestionar Campañas</Button>}
                    <Button variant="secondary" className="flex-1 rounded-full text-xs h-8 px-4 font-bold" onClick={handlePromotionClick}><Zap className="w-4 h-4 mr-2 text-yellow-500"/>Emprende por Hoy</Button>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-around font-semibold text-center border-b mt-2">
            <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={router.pathname === '/profile/publications'}>
               <Link href="/profile/publications">{`Publicaciones ${galleryCount}`}</Link>
            </Button>
            {isProvider && (
                <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={router.pathname === '/profile/catalog'}>
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

