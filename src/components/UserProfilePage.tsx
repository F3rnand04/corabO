'use client';

import { useRouter } from 'next/navigation';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';
import { ProductGridCard } from '@/components/ProductGridCard';
import { Badge } from '@/components/ui/badge';
import { ProductDetailsDialog } from '@/components/ProductDetailsDialog';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase-client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getPublicProfile, getProfileGallery, getProfileProducts } from '@/lib/actions/feed.actions';
import { createAppointmentRequest, requestAffiliation } from '@/lib/actions';
import { sendMessage } from '@/lib/actions/messaging.actions';
import { addContactToUser } from '@/lib/actions/user.actions';
import { ProfileGalleryView } from './ProfileGalleryView';
import { CampaignDialog } from './CampaignDialog';
import { SubscriptionDialog } from './SubscriptionDialog';
import { EditableAvatar } from './EditableAvatar';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { useAuth } from '@/hooks/use-auth-provider';
import { ProfileStats } from './ProfileStats';
import { ProfileDetails } from './profile/ProfileDetails';
import { ScheduleEditor } from './profile/ScheduleEditor';
import { AffiliationHandler } from './profile/AffiliationHandler';


export function UserProfilePage({ userId }: { userId: string}) {
  const { currentUser, users, transactions, addContact, isContact } = useAuth();
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
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState(false);

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

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-0 md:px-2 max-w-2xl pb-24">
        
        <ProfileDetails provider={provider} isSelfProfile={isSelfProfile} onContact={() => {
            if (!currentUser) return;
            sendMessage({ recipientId: provider.id, text: `¡Hola! Me interesa tu perfil.`, conversationId: [currentUser.id, provider.id].sort().join('-'), senderId: currentUser.id }).then(id => router.push(`/messages/${id}`))
        }} />
        
        <div className="px-4 py-4 space-y-4">
            <AffiliationHandler provider={provider} />
            <ScheduleEditor provider={provider} isSelfProfile={isSelfProfile}/>
        </div>
            
        {isSelfProfile && isProvider && !isCompany && (
          <div className="flex items-center gap-2 mt-4 px-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsCampaignDialogOpen(true)}><Megaphone className="w-4 h-4 mr-2"/>Campañas</Button>
          </div>
        )}
        
        {/* Tabs for content */}
        <div className="border-b mt-4 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
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
      <TransactionDetailsDialog isOpen={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)} transaction={selectedTransaction} />
    </div>
  );
}
