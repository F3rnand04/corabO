
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, FirebaseUserInput } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { getFirestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, Unsubscribe, writeBatch, deleteField } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import * as Actions from '@/lib/actions';
import { useAuth } from '@/components/auth/AuthProvider';

interface CoraboContextValue {
  currentUser: User | null;
  isLoadingUser: boolean; 
  syncCoraboUser: (firebaseUser: FirebaseUserInput) => Promise<void>;
  clearCoraboUser: () => void;
  
  users: User[];
  transactions: Transaction[];
  conversations: Conversation[];
  allPublications: GalleryImage[];
  searchQuery: string;
  categoryFilter: string | null;
  contacts: User[];
  searchHistory: string[];
  deliveryAddress: string;
  exchangeRate: number;
  currentUserLocation: GeolocationCoords | null;
  tempRecipientInfo: TempRecipientInfo | null;
  activeCartForCheckout: CartItem[] | null;
  cart: CartItem[];
  qrSession: QrSession | null;

  fetchUser: (userId: string) => User | null;
  getUserMetrics: (userId: string) => UserMetrics;
  setSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  setCategoryFilter: (category: string | null) => void;
  addContact: (user: User) => boolean;
  isContact: (userId: string) => boolean;
  removeContact: (userId: string) => void;
  toggleGps: (userId: string) => void;
  getDistanceToProvider: (provider: User) => string | null;
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  getAgendaEvents: (transactions: Transaction[]) => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  setCurrentUser: (user: User | null) => void; // Expose setCurrentUser
}

interface GeolocationCoords {
    latitude: number;
    longitude: number;
}

interface UserMetrics {
    reputation: number;
    effectiveness: number;
    responseTime: string;
    paymentSpeed: string;
}

export const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);

interface CoraboProviderProps {
    children: ReactNode;
}

export const CoraboProvider = ({ children }: CoraboProviderProps) => {
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); 
  
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [deliveryAddress, _setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<GeolocationCoords | null>(null);
  const [tempRecipientInfo, _setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  
  const userCache = useRef<Map<string, User>>(new Map());

  
  const setDeliveryAddress = useCallback((address: string) => {
    sessionStorage.setItem('coraboDeliveryAddress', address);
    _setDeliveryAddress(address);
  }, []);
  
  const setTempRecipientInfo = useCallback((info: TempRecipientInfo | null) => {
      if (info) {
          sessionStorage.setItem('tempRecipientInfo', JSON.stringify(info));
      } else {
          sessionStorage.removeItem('tempRecipientInfo');
      }
      _setTempRecipientInfo(info);
  }, []);

  const syncCoraboUser = useCallback(async (firebaseUser: FirebaseUserInput) => {
    setIsLoadingUser(true);
    try {
        const coraboProfile = await Actions.getOrCreateUser(firebaseUser);
        if (coraboProfile) {
            setCurrentUser(coraboProfile);
        } else {
           throw new Error("El perfil de Corabo devuelto es nulo.");
        }
    } catch (e) {
        console.error("Fatal error syncing user profile:", e);
        toast({ variant: 'destructive', title: "Error de Sincronización", description: "No se pudo cargar tu perfil de Corabo. Intenta recargar." });
        setCurrentUser(null);
    } finally {
        setIsLoadingUser(false);
    }
  }, [toast]);
  
  const clearCoraboUser = useCallback(() => {
    setCurrentUser(null);
    setIsLoadingUser(true); // Set to true on logout to show loader during redirect
  }, []);

  useEffect(() => {
    const savedAddress = sessionStorage.getItem('coraboDeliveryAddress');
    if (savedAddress) _setDeliveryAddress(savedAddress);
    
    const savedRecipient = sessionStorage.getItem('tempRecipientInfo');
    if(savedRecipient) _setTempRecipientInfo(JSON.parse(savedRecipient));

  }, []);

  useEffect(() => {
    const savedContacts = localStorage.getItem('coraboContacts');
    if (savedContacts) setContacts(JSON.parse(savedContacts));
  }, []);

  useEffect(() => {
    localStorage.setItem('coraboContacts', JSON.stringify(contacts));
  }, [contacts]);

  const fetchUser = useCallback((userId: string): User | null => {
        if (userCache.current.has(userId)) return userCache.current.get(userId)!;
        
        const user = users.find(u => u.id === userId);
        if (user) {
            userCache.current.set(userId, user);
            return user;
        }

        return null;
  }, [users]);
  
  
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;
    
    let unsubscribes: Unsubscribe[] = [];

    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    }));

    unsubscribes.push(onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        const pubs = snapshot.docs.map(doc => doc.data() as GalleryImage);
        setAllPublications(pubs);
    }));

    if (currentUser?.id) {
        // We already have the main user data, but we listen for realtime updates to it.
        const userDocRef = doc(db, 'users', currentUser.id);
        unsubscribes.push(onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setCurrentUser(prev => ({ ...prev, ...doc.data() }));
            }
        }));

        const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
        const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id), orderBy("lastUpdated", "desc"));

        unsubscribes.push(onSnapshot(transactionsQuery, (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))));
        unsubscribes.push(onSnapshot(conversationsQuery, (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation))));
    } else {
        setTransactions([]);
        setConversations([]);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.id]);

  const getDistanceToProvider = useCallback((provider: User) => {
      if (!currentUserLocation || !provider.profileSetupData?.location) return null;
      const [lat2, lon2] = provider.profileSetupData.location.split(',').map(Number);
      const distanceKm = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat2, lon2);
      if (provider.profileSetupData.showExactLocation === false) return `~${distanceKm.toFixed(0)} km`;
      return `${distanceKm.toFixed(0)} km`;
  }, [currentUserLocation]);
  
  const setDeliveryAddressToCurrent = useCallback(() => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                setCurrentUserLocation(newLocation);
                setDeliveryAddress(`${newLocation.latitude},${newLocation.longitude}`);
            },
            (error) => {
                toast({ variant: 'destructive', title: 'Error de Ubicación', description: 'No se pudo obtener tu ubicación actual.'});
                console.error("Error getting geolocation: ", error)
            }
        );
    }
  }, [setDeliveryAddress, toast]);

    const getUserMetrics = useCallback((userId: string): UserMetrics => {
        const userTxs = transactions.filter(tx => tx.providerId === userId && (tx.status === 'Pagado' || tx.status === 'Resuelto'));
        const ratings = userTxs.map(tx => tx.details.clientRating || 0).filter(r => r > 0);
        const reputation = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5.0;
        const totalCompleted = userTxs.length;
        const disputed = transactions.filter(tx => tx.providerId === userId && tx.status === 'En Disputa').length;
        const effectiveness = totalCompleted + disputed > 0 ? (totalCompleted / (totalCompleted + disputed)) * 100 : 100;
        let responseTime = 'Nuevo';
        if (totalCompleted > 5) responseTime = 'Rápido';
        if (totalCompleted > 15) responseTime = 'Muy Rápido';
        const paymentTimes = userTxs.map(tx => tx.details.paymentSentAt && tx.details.paymentRequestedAt ? new Date(tx.details.paymentSentAt).getTime() - new Date(tx.details.paymentRequestedAt).getTime() : 0).filter(t => t > 0);
        let paymentSpeed = 'N/A';
        if(paymentTimes.length > 0) {
            const avgMinutes = (paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length) / 60000;
            if(avgMinutes < 15) paymentSpeed = '<15 min';
            else if (avgMinutes < 60) paymentSpeed = '<1 hr';
            else paymentSpeed = `+${Math.floor(avgMinutes / 60)} hr`;
        }
        return { reputation, effectiveness, responseTime, paymentSpeed };
    }, [transactions]);

    const getAgendaEvents = useCallback((agendaTransactions: Transaction[]) => {
      return agendaTransactions.filter(tx => tx.status === 'Finalizado - Pendiente de Pago').map(tx => ({
        date: new Date(tx.date), type: 'payment' as 'payment' | 'task', description: `Pago a ${tx.providerId}`, transactionId: tx.id,
      }));
    }, []);
    
    const activeCartTx = useMemo(() => {
      if (!currentUser?.id) return null;
      return transactions.find(tx => tx.clientId === currentUser.id && tx.status === 'Carrito Activo')
    }, [transactions, currentUser?.id]);

    const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

    const addContact = (user: User): boolean => {
        let isNew = false;
        setContacts(prev => {
            if (prev.some(c => c.id === user.id)) {
                isNew = false;
                return prev;
            }
            isNew = true;
            return [...prev, user];
        });
        return isNew;
    }

    const value: CoraboContextValue = {
        currentUser,
        isLoadingUser, 
        syncCoraboUser,
        clearCoraboUser,
        users, transactions, conversations, allPublications,
        searchQuery, categoryFilter, contacts, searchHistory, 
        deliveryAddress, exchangeRate, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
        cart, qrSession,
        setCurrentUser,
        setSearchQuery: (query: string) => {
            _setSearchQuery(query);
            if (query.trim() && !searchHistory.includes(query.trim())) setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
        },
        setCategoryFilter,
        clearSearchHistory: () => setSearchHistory([]),
        addContact,
        removeContact: (userId: string) => setContacts(prev => prev.filter(c => c.id !== userId)),
        isContact: (userId: string) => contacts.some(c => c.id === userId),
        getAgendaEvents,
        setDeliveryAddress,
        setDeliveryAddressToCurrent,
        getUserMetrics,
        fetchUser,
        getDistanceToProvider,
        setTempRecipientInfo,
        setActiveCartForCheckout,
        toggleGps: Actions.toggleGps,
    };
  
    return (
        <CoraboContext.Provider value={value}>
            {children}
        </CoraboContext.Provider>
    );
};

export const useCorabo = () => {
    const context = useContext(CoraboContext);
     if (context === undefined) {
        throw new Error('useCorabo must be used within a CoraboProvider');
    }
    return context;
}
