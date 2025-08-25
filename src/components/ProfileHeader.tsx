
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Star, Megaphone, Zap, Plus, Wallet, MapPin, Calendar as CalendarIcon, TrendingUp, Timer, UserRoundCog, Handshake, Stethoscope, Utensils, Home as HomeIcon, Briefcase, Scissors, Car, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import type { Transaction, SpecializedData } from '@/lib/types';
import { SubscriptionDialog } from './SubscriptionDialog';
import { EditableAvatar } from './EditableAvatar';

const categoryIcons: { [key: string]: React.ElementType } = {
  'Salud y Bienestar': Stethoscope,
  'Alimentos y Restaurantes': Utensils,
  'Hogar y Reparaciones': HomeIcon,
  'Tecnología y Soporte': Briefcase,
  'Eventos': Briefcase,
  'Belleza': Scissors,
  'Automotriz y Repuestos': Car,
};

const DetailBadge = ({ value, icon }: { value: string; icon?: React.ElementType }) => {
    const Icon = icon;
    return (
        <Badge variant="secondary" className="font-normal">
            {Icon && <Icon className="w-3 h-3 mr-1.5" />}
            {value}
        </Badge>
    );
};

const renderSpecializedBadges = (specializedData?: SpecializedData) => {
    if (!specializedData) return null;
    
    const badges = [];
    const allSkills = [
        ...(specializedData.mainTrades || []),
        ...(specializedData.mainServices || []),
        ...(specializedData.beautyTrades || []),
        ...(specializedData.specialties || []),
        ...(specializedData.specificSkills || []),
        ...(specializedData.keySkills || []),
    ];

    if (allSkills.length > 0) {
        // Show the first 2-3 skills directly
        const visibleSkills = allSkills.slice(0, 2);
        visibleSkills.forEach(skill => {
            badges.push(<DetailBadge key={skill} value={skill} />);
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 pt-3">
            {badges}
        </div>
    );
};

function ProfileStats({ metrics }: { metrics: any }) {
  const { reputation, effectiveness, responseTime, paymentSpeed } = metrics;
  // A user is new if they don't have a calculable response time.
  const isNewProvider = responseTime === 'N/A';
  
  const paymentSpeedColor = (speed: string | undefined | null) => {
    if (!speed) return 'text-muted-foreground';
    if (speed.includes('+')) return 'text-red-500';
    if (speed.includes('5-15')) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mt-1 text-muted-foreground">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
        <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
      </div>
      <div className="w-px h-3 bg-border mx-1"></div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500"/>
          <span className="font-semibold text-foreground">{effectiveness.toFixed(0)}%</span>
      </div>
      
      {isNewProvider ? (
        <>
            <div className="w-px h-3 bg-border mx-1"></div>
            <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
        </>
      ) : (
        <>
            {paymentSpeed && (
                <>
                <div className="w-px h-3 bg-border mx-1"></div>
                <div className={cn("flex items-center gap-1 font-semibold", paymentSpeedColor(paymentSpeed))}>
                    <Timer className="w-4 h-4"/>
                    <span>{paymentSpeed}</span>
                </div>
                </>
            )}
        </>
      )}
    </div>
  );
}


export function ProfileHeader() {
  const { currentUser, getUserMetrics, transactions, getAgendaEvents, toggleGps, allPublications } = useCorabo();
  
  const router = useRouter();
  const pathname = usePathname();

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  if (!currentUser) return null;

  const isProvider = currentUser.type === 'provider';
  const isCompany = isProvider && currentUser.profileSetupData?.providerType === 'company';
  
  const metrics = useMemo(() => getUserMetrics(currentUser.id), [currentUser.id, getUserMetrics, transactions]);
  
  const displayName = currentUser.profileSetupData?.useUsername && currentUser.profileSetupData.username 
    ? currentUser.profileSetupData.username 
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
  
  const DetailsIcon = categoryIcons[currentUser.profileSetupData?.primaryCategory || ''] || Briefcase;
  const allSpecializedSkills = [
      ...(currentUser.profileSetupData?.specializedData?.mainTrades || []),
      ...(currentUser.profileSetupData?.specializedData?.mainServices || []),
      ...(currentUser.profileSetupData?.specializedData?.beautyTrades || []),
      ...(currentUser.profileSetupData?.specializedData?.specialties || []),
      ...(currentUser.profileSetupData?.specializedData?.specificSkills || []),
      ...(currentUser.profileSetupData?.specializedData?.keySkills || []),
  ];

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-2">
         <div className="flex items-center space-x-4">
            <EditableAvatar user={{ id: currentUser.id, name: currentUser.name, profileImage: currentUser.profileImage }} />
            <div className="flex-grow min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{specialty}</p>
                <ProfileStats metrics={metrics} />
            </div>
             <div className="flex flex-col items-end gap-2 shrink-0">
                {!currentUser.isSubscribed && (
                     <Button variant="link" size="sm" className="p-0 h-auto text-red-500 hover:text-red-600 font-semibold text-xs" onClick={() => setIsSubscriptionDialogOpen(true)}>
                        Suscribir
                    </Button>
                )}
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => toggleGps(currentUser.id)}><MapPin className={cn("h-5 w-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")} /></Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><CalendarIcon className="w-5 h-5"/></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="multiple" selected={eventDates} onDayClick={handleDayClick} /></PopoverContent>
                    </Popover>
                    <Button asChild variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><Link href="/transactions"><Wallet className="w-5 h-5"/></Link></Button>
                    <Button asChild variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><Link href="/profile-setup/details"><UserRoundCog className="w-5 h-5"/></Link></Button>
                 </div>
            </div>
        </div>
        
         <div className="flex flex-wrap items-center gap-2 pt-3">
            {renderSpecializedBadges(currentUser.profileSetupData?.specializedData)}
            {allSpecializedSkills.length > 2 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-1 text-xs p-1 h-auto text-muted-foreground">
                            <DetailsIcon className="w-4 h-4 text-primary"/>
                            Ver más
                            <MoreHorizontal className="w-3 h-3 ml-1" />
                        </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-72">
                        <div className="space-y-2 text-sm">
                            <h4 className="font-bold mb-2">Todas las Habilidades</h4>
                            <div className="flex flex-wrap gap-1">
                                {allSpecializedSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>


        <div className="flex items-center gap-2 mt-4">
            {isProvider && !isCompany && (
                <Button asChild variant="outline" className="flex-1">
                    <Link href="/emprende">
                        <Zap className="w-4 h-4 mr-2"/>
                        Emprende por Hoy
                    </Link>
                </Button>
            )}
            
            {isCompany && (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setIsCampaignDialogOpen(true)}>
                    <Megaphone className="w-4 h-4 mr-2"/>
                    Gestionar Campañas
                </Button>
                <Button asChild variant="outline" className="flex-1">
                    <Link href="/admin">
                        <Handshake className="w-4 h-4 mr-2"/>
                        Gestión de Talento Asociado
                    </Link>
                </Button>
              </>
            )}
        </div>
        
        <div className="flex justify-around font-semibold text-center border-b mt-4">
            <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={pathname === '/profile/publications'}>
               <Link href="/profile/publications">
                    Publicaciones <span className='font-mono ml-2 text-xs'>({galleryCount})</span>
               </Link>
            </Button>
            {isProvider && currentUser.profileSetupData?.offerType !== 'service' && (
                <Button asChild variant="ghost" className="flex-1 p-3 rounded-none text-muted-foreground data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary" data-active={pathname === '/profile/catalog'}>
                    <Link href="/profile/catalog">
                        Catálogo <span className='font-mono ml-2 text-xs'>({productCount})</span>
                    </Link>
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
