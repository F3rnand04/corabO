
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-provider';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, Calendar, MapPin, Bookmark, Send, ChevronLeft, MessageCircle, CheckCircle, Flag, Package, Hand, MoreHorizontal, Wallet, Megaphone, Zap, Timer, TrendingUp, UserRoundCog, BrainCircuit, Wrench, Car, Scissors, Home as HomeIcon, Utensils, Briefcase, Building, Users, Search, Loader2, Handshake, Settings, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useMemo } from 'react';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import type { User, GalleryImage, Product, Transaction, Affiliation, SpecializedData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from '@/components/ReportDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';
import { ProductGridCard } from '@/components/ProductGridCard';
import { Badge } from '@/components/ui/badge';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase-client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getPublicProfile, getProfileGallery, getProfileProducts } from '@/lib/actions/feed.actions';
import { createAppointmentRequest } from '@/lib/actions/transaction.actions';
import { sendMessage } from '@/lib/actions/messaging.actions';
import { toggleGps, addContactToUser } from '@/lib/actions/user.actions';
import { ProfileGalleryView } from './ProfileGalleryView';
import { CampaignDialog } from './CampaignDialog';
import { SubscriptionDialog } from './SubscriptionDialog';
import { EditableAvatar } from './EditableAvatar';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { haversineDistance } from '@/lib/utils';
import { useCorabo } from '@/hooks/use-corabo';


const categoryIcons: { [key: string]: React.ElementType } = {
    'Salud y Bienestar': BrainCircuit,
    'Alimentos y Restaurantes': Utensils,
    'Hogar y Reparaciones': HomeIcon,
    'Tecnología y Soporte': Briefcase,
    'Eventos': Briefcase,
    'Belleza': Scissors,
    'Automotriz y Repuestos': Car,
    'Transporte y Asistencia': Wrench,
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


function ProfileStats({ metrics, isNew }: { metrics: any, isNew: boolean }) {
  const { reputation, effectiveness, responseTime } = metrics;
  
  return (
    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mt-1 text-muted-foreground">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
        <span className="font-semibold text-foreground">{reputation.toFixed(1)}</span>
      </div>
       <Separator orientation="vertical" className="h-3" />
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500"/>
          <span className="font-semibold text-foreground">{effectiveness.toFixed(0)}%</span>
      </div>
      
      {isNew ? (
        <>
            <Separator orientation="vertical" className="h-3" />
            <Badge variant="secondary" className="px-1.5 py-0">Nuevo</Badge>
        </>
      ) : (
        <>
            <Separator orientation="vertical" className="h-3" />
             <div className="flex items-center gap-1 font-semibold text-green-600">
                <Timer className="w-4 h-4"/>
                <span>{responseTime}</span>
            </div>
        </>
      )}
    </div>
  );
}


export function UserProfilePage({ userId }: { userId: string}) {
  const { currentUser, addContact } = useAuth();
  const { users, transactions, isContact, currentUserLocation } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [provider, setProvider] = useState<User | null>(null);
  const [providerProducts, setProviderProducts] = useState<Product[]>([]);
  const [providerGallery, setProviderGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [affiliatedProfessionals, setAffiliatedProfessionals] = useState<User[]>([]);
  
  const [activeTab, setActiveTab] = useState<'publications' | 'catalog'>('publications');

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState('');

  const isSelfProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        return;
    };
    
    const loadProfileData = async () => {
        setIsLoading(true);
        try {
            const fetchedProvider = await getPublicProfile(userId);
            if (!fetchedProvider) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar el perfil." });
                router.push('/');
                return;
            }
            setProvider(fetchedProvider as User);
            
            const offerType = fetchedProvider.profileSetupData?.offerType;
            if(offerType === 'product' || offerType === 'both') {
                const productsResult = await getProfileProducts({ userId, limitNum: 50 });
                setProviderProducts(productsResult.products || []);
                setActiveTab('catalog');
            }
            if(offerType === 'service' || offerType === 'both' || !offerType) {
                const galleryResult = await getProfileGallery({ userId, limitNum: 50 });
                setProviderGallery(galleryResult.gallery || []);
                setActiveTab('publications');
            }
        } catch (error) {
            console.error("Error loading provider data:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el perfil del proveedor." });
        } finally {
            setIsLoading(false);
        }
    };
    
    loadProfileData();

  }, [userId, toast, router]);
  

  useEffect(() => {
    if (provider?.profileSetupData?.providerType === 'company') {
      const q = query(collection(db, 'affiliations'), where('companyId', '==', provider.id), where('status', '==', 'approved'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const professionalIds = snapshot.docs.map(doc => (doc.data() as Affiliation).providerId);
        const professionals = users.filter(u => professionalIds.includes(u.id));
        setAffiliatedProfessionals(professionals);
      });
      return () => unsubscribe();
    }
  }, [provider, users]);

  const filteredProducts = useMemo(() => {
    if (!catalogSearchQuery) return providerProducts;
    return providerProducts.filter(p => p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()));
  }, [providerProducts, catalogSearchQuery]);

  const { reputation, effectiveness, responseTime, agendaEvents, eventDates } = useMemo(() => {
    if (!provider) return { reputation: 0, effectiveness: 0, responseTime: 'N/A', agendaEvents: [], eventDates: [] };

    const userTransactions = transactions.filter(tx => tx.providerId === provider.id || tx.clientId === provider.id);
    const ratedTransactions = userTransactions.filter(tx => tx.providerId === provider.id && tx.details.clientRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0);
    const rep = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    const relevantTransactions = userTransactions.filter(tx => tx.type !== 'Sistema' && tx.status !== 'Carrito Activo');
    const successfulTransactions = relevantTransactions.filter(tx => tx.status === 'Pagado' || tx.status === 'Resuelto');
    const eff = relevantTransactions.length > 0 ? (successfulTransactions.length / relevantTransactions.length) * 100 : 100;
    
    const quoteRequests = userTransactions.filter(tx => tx.providerId === provider.id && tx.status === 'Cotización Recibida');
    const respTime = quoteRequests.length > 5 ? 'Rápido' : (userTransactions.length > 0 ? 'Normal' : 'Nuevo');
    
    const events = userTransactions
        .filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status))
        .map(tx => ({
            date: new Date(tx.date),
            type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment',
            transactionId: tx.id,
        }));
    const dates = events.map(e => e.date);

    return { reputation: rep, effectiveness: eff, responseTime: respTime, agendaEvents: events, eventDates: dates };
}, [provider, transactions]);
  
  const distance = useMemo(() => {
    if (currentUserLocation && provider?.profileSetupData?.location) {
        const [lat, lon] = provider.profileSetupData.location.split(',').map(Number);
        const dist = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat, lon);
        return dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
    }
    return null;
  }, [currentUserLocation, provider?.profileSetupData?.location]);


  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!provider) {
    return (
      <main className="container py-8 text-center">
        <h1 className="text-3xl font-bold">Perfil no encontrado</h1>
        <p className="text-muted-foreground mt-4">No se pudo encontrar el proveedor que estás buscando.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </main>
    );
  }

  const isProvider = provider.type === 'provider';
  const isCompany = isProvider && provider.profileSetupData?.providerType === 'company';
  const offerType = provider.profileSetupData?.offerType;
  const specializedData = provider.profileSetupData?.specializedData;
  const allSpecializedSkills = [
      ...(specializedData?.mainTrades || []), ...(specializedData?.mainServices || []),
      ...(specializedData?.beautyTrades || []), ...(specializedData?.specialties || []),
      ...(specializedData?.specificSkills || []), ...(specializedData?.keySkills || []),
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (!currentUser?.isTransactionsActive) {
         toast({ variant: 'destructive', title: "Acción Requerida", description: "Por favor, activa tu registro de transacciones para poder agendar citas." }); return;
    }
    if (!provider.isTransactionsActive) {
         toast({ variant: 'destructive', title: "Proveedor no disponible", description: "Este proveedor no tiene las transacciones activas en este momento." }); return;
    }
    if (date && provider) {
        setAppointmentDate(date);
        setIsAppointmentDialogOpen(true);
    }
  };

  const handleConfirmAppointment = async () => {
    if (appointmentDate && provider && currentUser) {
        await createAppointmentRequest({
            providerId: provider.id,
            clientId: currentUser.id,
            date: appointmentDate.toISOString(),
            details: appointmentDetails,
            amount: provider.profileSetupData?.appointmentCost || 0,
        });
        setIsAppointmentDialogOpen(false);
        setAppointmentDetails('');
        toast({ title: "Solicitud de Cita Enviada", description: "El proveedor revisará tu solicitud." });
    }
  };
  
  const isNewProvider = responseTime === 'Nuevo';
  const disabledDays = Object.entries(provider.profileSetupData?.schedule || {}).filter(([, dayDetails]) => !(dayDetails as any).active).map(([dayName]) => ({ 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 }[dayName] as number));
  const displayName = provider.profileSetupData?.useUsername && provider.profileSetupData.username ? provider.profileSetupData.username : provider.name;
  const specialty = provider.profileSetupData?.specialty || "Sin especialidad definida";
  const categoryPlaceholders: { [key: string]: string } = { 'Hogar y Reparaciones': 'Ej: Fuga en el baño.', 'Tecnología y Soporte': 'Ej: Mi PC no enciende.', 'Automotriz y Repuestos': 'Ej: Cambio de aceite.', 'Alimentos y Restaurantes': 'Ej: Cotización para 20 personas.', 'Salud y Bienestar': 'Ej: Consulta de fisioterapia.', 'Belleza': 'Ej: Corte y secado.', 'Eventos': 'Ej: Fotógrafo para cumpleaños.'};
  const appointmentPlaceholder = categoryPlaceholders[provider.profileSetupData?.primaryCategory || ''] || 'Ej: Quisiera discutir los detalles...';
  const DetailsIcon = categoryIcons[provider.profileSetupData?.primaryCategory || ''] || Briefcase;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-0 md:px-2 max-w-2xl pb-24">
        
        {/* Profile Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-2">
            <div className="flex items-center space-x-4">
              {isSelfProfile && currentUser ? (
                 <EditableAvatar user={{ id: currentUser.id, name: currentUser.name, profileImage: currentUser.profileImage }} />
              ) : (
                <Avatar className="w-16 h-16 shrink-0"><AvatarImage src={provider.profileImage} alt={displayName} /><AvatarFallback>{displayName.charAt(0)}</AvatarFallback></Avatar>
              )}
             
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground truncate">{displayName}</h1>
                  {provider.isSubscribed && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  {isCompany && <Building className="w-4 h-4 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">{specialty}</p>
                <ProfileStats metrics={{ reputation, effectiveness, responseTime }} isNew={isNewProvider} />
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                 {!isSelfProfile && <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80 font-semibold text-xs" onClick={() => sendMessage({recipientId: provider.id, text: `¡Hola! Me interesa tu perfil.`, conversationId: [currentUser!.id, provider.id].sort().join('-'), senderId: currentUser!.id}).then(id => router.push(`/messages/${id}`))}>Contactar</Button>}
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => isSelfProfile && toggleGps(provider.id)}><MapPin className={cn("h-5 w-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} /></Button>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><Calendar className="w-5 h-5"/></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><CalendarComponent mode="multiple" selected={eventDates} onDayClick={handleDateSelect} disabled={[{ dayOfWeek: disabledDays }, { before: new Date() }]} /></PopoverContent>
                    </Popover>
                    {isSelfProfile && <Button asChild variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><Link href="/transactions"><Wallet className="w-5 h-5"/></Link></Button>}
                 </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {renderSpecializedBadges(specializedData)}
              {allSpecializedSkills.length > 2 && (
                <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" className="flex items-center gap-1 text-xs p-1 h-auto text-muted-foreground"><DetailsIcon className="w-4 h-4 text-primary"/>Ver más<MoreHorizontal className="w-3 h-3 ml-1" /></Button></PopoverTrigger>
                    <PopoverContent className="w-72"><div className="space-y-2 text-sm"><h4 className="font-bold mb-2">Todas las Habilidades</h4><div className="flex flex-wrap gap-1">{allSpecializedSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div></PopoverContent>
                </Popover>
              )}
            </div>

            {isSelfProfile && isProvider && (
              <div className="flex items-center gap-2 mt-4">
                  <Button asChild variant="outline" className="flex-1"><Link href="/profile-setup/details"><Edit className="w-4 h-4 mr-2"/>Editar Perfil</Link></Button>
                  {isCompany && <Button variant="outline" className="flex-1" onClick={() => setIsCampaignDialogOpen(true)}><Megaphone className="w-4 h-4 mr-2"/>Campañas</Button>}
                  {isCompany && <Button asChild variant="outline" className="flex-1"><Link href="/admin?tab=affiliations"><Handshake className="w-4 h-4 mr-2"/>Talento</Link></Button>}
              </div>
            )}
            
            {provider.activeAffiliation && (
                <Link href={`/companies/${provider.activeAffiliation.companyId}`} className="group block mt-4">
                    <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 border hover:border-primary/50 transition-colors"><Avatar className="w-10 h-10 shrink-0"><AvatarImage src={provider.activeAffiliation.companyProfileImage} /><AvatarFallback>{provider.activeAffiliation.companyName.charAt(0)}</AvatarFallback></Avatar><div><p className="text-xs text-muted-foreground">Verificado por:</p><p className="font-semibold text-foreground group-hover:underline">{provider.activeAffiliation.companyName}</p><p className="text-xs text-muted-foreground">{provider.activeAffiliation.companySpecialty}</p></div></div>
                </Link>
            )}

            {!isSelfProfile && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" onClick={() => addContactToUser(currentUser!.id, provider.id)}><Bookmark className="w-4 h-4 mr-2"/>Guardar</Button>
                <Button onClick={() => sendMessage({recipientId: provider.id, text: `¡Hola! Me interesa tu perfil.`, conversationId: [currentUser!.id, provider.id].sort().join('-'), senderId: currentUser!.id}).then(id => router.push(`/messages/${id}`))}><MessageCircle className="w-4 h-4 mr-2"/>Mensaje</Button>
              </div>
            )}
        </div>
        
        {/* Tabs for content */}
        <div className="border-b mt-4 sticky top-[152px] z-20 bg-background/95 backdrop-blur-sm">
            <div className="container flex justify-around">
                {(offerType === 'service' || offerType === 'both' || !offerType) && <Button variant="ghost" className={cn("flex-1 rounded-none", activeTab === 'publications' && 'border-b-2 border-primary text-primary')} onClick={() => setActiveTab('publications')}>Publicaciones</Button>}
                {(offerType === 'product' || offerType === 'both') && <Button variant="ghost" className={cn("flex-1 rounded-none", activeTab === 'catalog' && 'border-b-2 border-primary text-primary')} onClick={() => setActiveTab('catalog')}>Catálogo</Button>}
                {isCompany && <Button variant="ghost" className={cn("flex-1 rounded-none", activeTab === 'team' && 'border-b-2 border-primary text-primary')} onClick={() => setActiveTab('team')}>Talento Asociado</Button>}
            </div>
        </div>

        <div className="mt-4">
             {activeTab === 'publications' && <ProfileGalleryView gallery={providerGallery} owner={provider} isLoading={isLoading} />}
             
             {activeTab === 'catalog' && (
                <div className="space-y-4">
                     <div className="px-4">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar en el catálogo..." className="pl-9" value={catalogSearchQuery} onChange={(e) => setCatalogSearchQuery(e.target.value)}/></div>
                    </div>
                    {isLoading ? <div className="text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : (
                        filteredProducts.length > 0 ? <div className="grid grid-cols-2 gap-2 px-2">{filteredProducts.map(p => <ProductGridCard key={p.id} product={p} onDoubleClick={() => {setSelectedProduct(p); setIsProductDetailsDialogOpen(true);}} />)}</div> : <div className="text-center py-10 text-muted-foreground"><p>No se encontraron productos.</p></div>
                    )}
                </div>
             )}

             {activeTab === 'team' && isCompany && (
                 <div className="px-4 space-y-3">
                    {affiliatedProfessionals.length > 0 ? affiliatedProfessionals.map(prof => (
                        <Link key={prof.id} href={`/companies/${prof.id}`}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"><Avatar><AvatarImage src={prof.profileImage}/><AvatarFallback>{prof.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{prof.name}</p><p className="text-sm text-muted-foreground">{prof.profileSetupData?.specialty}</p></div></div>
                        </Link>
                    )) : <div className="text-center py-10 text-muted-foreground"><p>Aún no tienes talento asociado.</p></div>}
                 </div>
             )}
        </div>
      </div>
      <ProductDetailsDialog isOpen={isProductDetailsDialogOpen} onOpenChange={setIsProductDetailsDialogOpen} product={selectedProduct} />
      <CampaignDialog isOpen={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen} />
      <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
      <TransactionDetailsDialog isOpen={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)} transaction={selectedTransaction} />
       <AlertDialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Solicitud de Cita</AlertDialogTitle><AlertDialogDescription>Estás a punto de solicitar una cita con {displayName} para el {appointmentDate ? format(appointmentDate, "PPP", { locale: es }) : ''}.</AlertDialogDescription></AlertDialogHeader>
          <div className="py-4 space-y-2"><Label htmlFor="appt-details">Añade detalles sobre lo que necesitas (opcional)</Label><Textarea id="appt-details" value={appointmentDetails} onChange={(e) => setAppointmentDetails(e.target.value)} placeholder={appointmentPlaceholder} /></div>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAppointment}>Confirmar Solicitud</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
