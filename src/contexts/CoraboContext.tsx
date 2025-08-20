
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation";
import { addDays, differenceInDays } from 'date-fns';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, arrayUnion, getDocs, deleteDoc, collectionGroup, Unsubscribe, orderBy, deleteField, arrayRemove } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

interface DailyQuote {
    requestSignature: string;
    count: number;
}

interface UserMetrics {
    reputation: number;
    effectiveness: number;
    responseTime: string;
    paymentSpeed: string;
}

interface GeolocationCoords {
    latitude: number;
    longitude: number;
}

// Separate state from actions for better management
interface CoraboState {
  users: User[];
  allPublications: GalleryImage[];
  transactions: Transaction[];
  conversations: Conversation[];
  cart: CartItem[];
  searchQuery: string;
  categoryFilter: string | null;
  contacts: User[];
  isGpsActive: boolean;
  searchHistory: string[];
  deliveryAddress: string;
  exchangeRate: number;
  qrSession: QrSession | null;
  currentUserLocation: GeolocationCoords | null;
  tempRecipientInfo: TempRecipientInfo | null;
  activeCartForCheckout: CartItem[] | null;
}

interface CoraboActions {
  // Define only state-updating methods here. Business logic will be moved.
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  clearSearchHistory: () => void;
  getCartTotal: (cartItems?: CartItem[]) => number;
  getDeliveryCost: (deliveryMethod: 'pickup' | 'home' | 'other_address' | 'current_location', providerId: string) => number;
  addContact: (user: User) => boolean;
  removeContact: (userId: string) => void;
  isContact: (userId: string) => boolean;
  getAgendaEvents: (transactions: Transaction[]) => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  getCartItemQuantity: (productId: string) => number;
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  getUserMetrics: (userId: string, transactions: Transaction[]) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  getDistanceToProvider: (provider: User) => string | null;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
}

const CoraboContext = createContext<(CoraboState & CoraboActions) | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Now we can safely use this hook
  
  const [users, setUsers] = useState<User[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [deliveryAddress, _setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<GeolocationCoords | null>(null);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  const [tempRecipientInfo, setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  
  const userCache = useRef<Map<string, User>>(new Map());

  const setDeliveryAddress = useCallback((address: string) => {
    sessionStorage.setItem('coraboDeliveryAddress', address);
    _setDeliveryAddress(address);
  }, []);
  
  const activeCartTx = useMemo(() => transactions.find(tx => tx.clientId === currentUser?.id && tx.status === 'Carrito Activo'), [transactions, currentUser?.id]);
  const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

  useEffect(() => {
    const savedAddress = sessionStorage.getItem('coraboDeliveryAddress');
    if (savedAddress) {
        _setDeliveryAddress(savedAddress);
    }
    const checkGeolocation = () => {
      if ('geolocation' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          const handleSuccess = (position: GeolocationPosition) => {
            setCurrentUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          };
          const handleError = (error: GeolocationPositionError) => {
             console.error("Error getting geolocation: ", error);
             if (error.code === 1) { // PERMISSION_DENIED
                toast({
                  title: "Permiso de Ubicación Denegado",
                  description: "Para ver distancias y usar el mapa, activa los permisos de ubicación en la configuración de tu navegador.",
                  variant: "destructive",
                  duration: 7000
                });
             }
          };

          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
          } else if (result.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
          }
        });
      }
    };
    checkGeolocation();
  }, [toast]);


  useEffect(() => {
    try {
        const savedContacts = localStorage.getItem('coraboContacts');
        if (savedContacts) {
            setContacts(JSON.parse(savedContacts));
        }
    } catch (e) {
        console.error("Failed to parse contacts from localStorage", e);
        setContacts([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('coraboContacts', JSON.stringify(contacts));
  }, [contacts]);

  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
        if (userCache.current.has(userId)) {
            return userCache.current.get(userId)!;
        }
        try {
          const db = getFirestoreDb();
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if(userSnap.exists()) {
            const user = userSnap.data() as User;
            userCache.current.set(userId, user);
            return user;
          }
        } catch (e) {
          console.error(`Failed to fetch user ${userId}`, e);
        }
        return null;
  }, []);

  useEffect(() => {
    const db = getFirestoreDb();
    
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    });
    
    const unsubscribePublications = onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    });

    let unsubscribeUserSpecificData: Unsubscribe[] = [];

    if (currentUser?.id) {
        const userTransactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
        const userConversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id), orderBy("lastUpdated", "desc"));
        const userQrSessionQuery = query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id));
        
        unsubscribeUserSpecificData.push(onSnapshot(userTransactionsQuery, (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))));
        
        unsubscribeUserSpecificData.push(onSnapshot(userConversationsQuery, (snapshot) => {
            setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
        }));
        
        unsubscribeUserSpecificData.push(onSnapshot(userQrSessionQuery, (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null)));
    } else {
        setTransactions([]); 
        setConversations([]); 
        setQrSession(null);
    }

    return () => {
        unsubscribeUsers();
        unsubscribePublications();
        unsubscribeUserSpecificData.forEach(unsub => unsub());
    };
  }, [currentUser?.id]);
  
  const getCartTotal = useCallback((cartItems: CartItem[] | undefined = cart) => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  
  const getDistanceToProvider = useCallback((provider: User) => {
      if (!currentUserLocation || !provider.profileSetupData?.location) return null;
      const [lat2, lon2] = provider.profileSetupData.location.split(',').map(Number);
      const distanceKm = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat2, lon2);
      
      if (provider.profileSetupData.showExactLocation === false) {
        return `${Math.max(1, Math.round(distanceKm))} km`;
      }

      return `${Math.round(distanceKm)} km`;
  }, [currentUserLocation]);
  
  const getDeliveryCost = useCallback((deliveryMethod: 'pickup' | 'home' | 'other_address' | 'current_location', providerId: string): number => {
    if (deliveryMethod === 'pickup') return 0;
    
    const provider = users.find(u => u.id === providerId);
    if (!provider) return 0;

    const distance = getDistanceToProvider(provider);
    if (distance === null) return 0;
    
    const distanceKm = parseFloat(distance.replace(' km', ''));
    return distanceKm * 1.05;
  }, [users, getDistanceToProvider]);

  const setDeliveryAddressToCurrent = useCallback(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setDeliveryAddress(`${latitude},${longitude}`);
                toast({ title: 'Ubicación Actual Establecida' });
            },
            (error) => {
                toast({ variant: 'destructive', title: 'Error de Ubicación', description: error.message });
            }
        );
    } else {
        toast({ variant: 'destructive', title: 'GPS no Soportado', description: 'Tu navegador no soporta geolocalización.' });
    }
  }, [setDeliveryAddress, toast]);

   const getUserMetrics = useCallback((userId: string, userTransactions: Transaction[]): UserMetrics => {
        const userTxs = userTransactions.filter(tx => tx.providerId === userId && (tx.status === 'Pagado' || tx.status === 'Resuelto'));
        const ratings = userTxs.map(tx => tx.details.clientRating || 0).filter(r => r > 0);
        const reputation = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5.0;

        const totalCompleted = userTxs.length;
        const disputed = userTransactions.filter(tx => tx.providerId === userId && tx.status === 'En Disputa').length;
        const effectiveness = totalCompleted + disputed > 0 ? (totalCompleted / (totalCompleted + disputed)) * 100 : 100;
        
        let responseTime = 'Nuevo';
        if (totalCompleted > 5) responseTime = 'Rápido';
        if (totalCompleted > 15) responseTime = 'Muy Rápido';

        const paymentSentTimes = userTxs.map(tx => tx.details.paymentSentAt ? new Date(tx.details.paymentSentAt).getTime() : 0);
        const paymentRequestedTimes = userTxs.map(tx => tx.details.paymentRequestedAt ? new Date(tx.details.paymentRequestedAt).getTime() : 0);
        let avgPaymentSpeed = 'N/A';
        if (paymentSentTimes.length > 0 && paymentRequestedTimes.length > 0) {
            const diffs = paymentSentTimes.map((sent, i) => sent - paymentRequestedTimes[i]);
            const avgDiff = diffs.reduce((a,b) => a+b, 0) / diffs.length;
            const minutes = Math.floor(avgDiff / 60000);
            if (minutes < 15) avgPaymentSpeed = '<15 min';
            else if (minutes < 60) avgPaymentSpeed = '<1hr';
            else avgPaymentSpeed = `+${Math.floor(minutes/60)}hr`;
        }

        return { reputation, effectiveness, responseTime, paymentSpeed: avgPaymentSpeed };
    }, []);

    const getAgendaEvents = useCallback((agendaTransactions: Transaction[]) => {
      return agendaTransactions.filter(tx => tx.status === 'Finalizado - Pendiente de Pago').map(tx => ({
        date: new Date(tx.date),
        type: 'payment' as 'payment' | 'task',
        description: `Pago a ${tx.providerId}`,
        transactionId: tx.id,
      }));
    }, []);


  const value = {
    users, allPublications, transactions, conversations, cart, searchQuery,
    categoryFilter, contacts, isGpsActive, searchHistory, 
    deliveryAddress, exchangeRate, qrSession, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    setSearchQuery: (query: string) => {
        _setSearchQuery(query);
        if (query.trim() && !searchHistory.includes(query.trim())) {
            setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
        }
    },
    setCategoryFilter,
    clearSearchHistory: () => setSearchHistory([]),
    getCartTotal,
    getDeliveryCost,
    addContact: (user: User) => {
        if (contacts.some(c => c.id === user.id)) return false;
        setContacts(prev => [...prev, user]);
        return true;
    },
    removeContact: (userId: string) => setContacts(prev => prev.filter(c => c.id !== userId)),
    isContact: (userId: string) => contacts.some(c => c.id === userId),
    getCartItemQuantity: (productId: string) => cart.find(item => item.product.id === productId)?.quantity || 0,
    setDeliveryAddress,
    setDeliveryAddressToCurrent,
    getUserMetrics,
    fetchUser,
    getDistanceToProvider,
    getAgendaEvents,
    setTempRecipientInfo,
    setActiveCartForCheckout,
  };
  
  return (
    <CoraboContext.Provider value={value as any}>
        {children}
    </CoraboContext.Provider>
  );
};

// Hook to use the context
export const useCorabo = (): CoraboState & CoraboActions => {
  const context = useContext(CoraboContext);
  if (context === undefined) {
    throw new Error('useCorabo must be used within a CoraboProvider');
  }
  return context;
};

export type { Transaction };
