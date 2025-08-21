"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { getFirestoreDb } from '@/contexts/firebase-client'; // CORREGIDO: Ruta de importación actualizada
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, Unsubscribe, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import * as Actions from '@/lib/actions';
import { type User as FirebaseUser } from 'firebase/auth';


interface CoraboContextValue {
  // State
  currentUser: User | null;
  isLoadingUser: boolean; 
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

  // Actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  clearSearchHistory: () => void;
  addContact: (user: User) => boolean;
  removeContact: (userId: string) => void;
  isContact: (userId: string) => boolean;
  getAgendaEvents: (transactions: Transaction[]) => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  getUserMetrics: (userId: string) => UserMetrics;
  fetchUser: (userId: string) => User | null;
  getDistanceToProvider: (provider: User) => string | null;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  toggleGps: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
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

const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);

interface CoraboProviderProps {
    children: ReactNode;
    firebaseUser: FirebaseUser | null;
    isAuthLoading: boolean;
}

export const CoraboProvider = ({ children, firebaseUser, isAuthLoading }: CoraboProviderProps) => {
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
  
  const userCache = useRef<Map<string, User>>(new Map());

  useEffect(() => {
    setIsLoadingUser(isAuthLoading);
    if (isAuthLoading) {
      setCurrentUser(null);
      return;
    }
    
    if (firebaseUser) {
      Actions.getOrCreateUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
      }).then(user => {
        setCurrentUser(user as User);
        setIsLoadingUser(false);
      }).catch(error => {
        console.error("Failed to get or create Corabo user:", error);
        setCurrentUser(null);
        setIsLoadingUser(false);
      });
    } else {
      setCurrentUser(null);
      setIsLoadingUser(false);
    }
  }, [firebaseUser, isAuthLoading]);
  
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
  

  useEffect(() => {
    const savedAddress = sessionStorage.getItem('coraboDeliveryAddress');
    if (savedAddress) _setDeliveryAddress(savedAddress);
    
    const savedRecipient = sessionStorage.getItem('tempRecipientInfo');
    if(savedRecipient) _setTempRecipientInfo(JSON.parse(savedRecipient));

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => setCurrentUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            (error) => console.error("Error getting geolocation: ", error)
        );
    }
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

    // General listeners
    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    }));

    if (currentUser?.id) {
        const userId = currentUser.id;
        
        const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", userId));
        const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", userId), orderBy("lastUpdated", "desc"));

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
      if (provider.profileSetupData.showExactLocation === false) return `~${Math.max(1, Math.round(distanceKm))} km`;
      return `${Math.round(distanceKm)} km`;
  }, [currentUserLocation]);
  
  const setDeliveryAddressToCurrent = useCallback(() => {
    if (currentUserLocation) setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
  }, [currentUserLocation, setDeliveryAddress]);

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

    const toggleGps = async () => {
      if (!currentUser) return;
      await Actions.toggleGps(currentUser.id, !!currentUser.isGpsActive);
      toast({
        title: `GPS ${!currentUser.isGpsActive ? 'Activado' : 'Desactivado'}`,
        description: `Tu ubicación ${!currentUser.isGpsActive ? 'ahora es visible' : 'ya no es visible'} para otros usuarios.`,
      });
    };
    
    const activeCartTx = useMemo(() => transactions.find(tx => tx.clientId === currentUser?.id && tx.status === 'Carrito Activo'), [transactions, currentUser?.id]);
    const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

    const value: CoraboContextValue = {
        currentUser,
        isLoadingUser,
        users, transactions, conversations, allPublications,
        searchQuery, categoryFilter, contacts, searchHistory, 
        deliveryAddress, exchangeRate, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
        cart,
        setSearchQuery: (query: string) => {
            _setSearchQuery(query);
            if (query.trim() && !searchHistory.includes(query.trim())) setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
        },
        setCategoryFilter,
        clearSearchHistory: () => setSearchHistory([]),
        addContact: (user: User) => {
            if (contacts.some(c => c.id === user.id)) return false;
            setContacts(prev => [...prev, user]);
            return true;
        },
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
        toggleGps,
        setCurrentUser,
    };
  
    return (
        <CoraboContext.Provider value={value}>
            {children}
        </CoraboContext.Provider>
    );
};

export const useCorabo = (): CoraboContextValue => {
    const context = useContext(CoraboContext);
    if (context === undefined) {
        throw new Error('useCorabo must be used within a CoraboProvider');
    }
    return context;
};

export type { Transaction };
