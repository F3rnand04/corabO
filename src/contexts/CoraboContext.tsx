

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, Unsubscribe } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import * as Actions from '@/lib/actions';

interface CoraboContextValue {
  // State
  currentUser: User | null;
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
  getUserMetrics: (userId: string, transactions: Transaction[]) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  getDistanceToProvider: (provider: User) => string | null;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
}

interface GeolocationCoords {
    latitude: number;
    longitude: number;
}

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

const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);

export const CoraboProvider = ({ children, currentUser }: { children: ReactNode, currentUser: User | null }) => {
  const { toast } = useToast();
  
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
  const [dailyQuotes, setDailyQuotes] = useState<DailyQuote[]>([]);
  
  const userCache = useRef<Map<string, User>>(new Map());

  const setDeliveryAddress = useCallback((address: string) => {
    sessionStorage.setItem('coraboDeliveryAddress', address);
    _setDeliveryAddress(address);
  }, []);
  
  const activeCartTx = useMemo(() => transactions.find(tx => tx.clientId === currentUser?.id && tx.status === 'Carrito Activo'), [transactions, currentUser?.id]);
  const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

  useEffect(() => {
    const savedAddress = sessionStorage.getItem('coraboDeliveryAddress');
    if (savedAddress) _setDeliveryAddress(savedAddress);

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

  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
        if (userCache.current.has(userId)) return userCache.current.get(userId)!;
        // In a real app, you might want to fetch from the server if not in the local 'users' state either
        const user = users.find(u => u.id === userId);
        if (user) {
            userCache.current.set(userId, user);
            return user;
        }
        return await Actions.getPublicProfile(userId);
  }, [users]);

  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;
    
    let unsubscribes: Unsubscribe[] = [];

    // Public data subscriptions (do not depend on currentUser)
    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    }));
    unsubscribes.push(onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    }));

    // User-specific data subscriptions
    if (currentUser?.id) {
        const userId = currentUser.id;
        const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", userId));
        const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", userId), orderBy("lastUpdated", "desc"));
        const qrSessionQuery = query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', userId));

        unsubscribes.push(onSnapshot(transactionsQuery, (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))));
        unsubscribes.push(onSnapshot(conversationsQuery, (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation))));
        unsubscribes.push(onSnapshot(qrSessionQuery, (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null)));
    } else {
        // Clear user-specific data when logged out
        setTransactions([]);
        setConversations([]);
        setQrSession(null);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.id]); // Rerun only when the user ID changes
  
  const getDistanceToProvider = useCallback((provider: User) => {
      if (!currentUserLocation || !provider.profileSetupData?.location) return null;
      const [lat2, lon2] = provider.profileSetupData.location.split(',').map(Number);
      const distanceKm = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat2, lon2);
      if (provider.profileSetupData.showExactLocation === false) return `${Math.max(1, Math.round(distanceKm))} km`;
      return `${Math.round(distanceKm)} km`;
  }, [currentUserLocation]);
  
  const setDeliveryAddressToCurrent = useCallback(() => {
    if (currentUserLocation) setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
  }, [currentUserLocation, setDeliveryAddress]);

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
        const paymentTimes = userTxs.map(tx => tx.details.paymentSentAt && tx.details.paymentRequestedAt ? new Date(tx.details.paymentSentAt).getTime() - new Date(tx.details.paymentRequestedAt).getTime() : 0).filter(t => t > 0);
        let paymentSpeed = 'N/A';
        if(paymentTimes.length > 0) {
            const avgMinutes = (paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length) / 60000;
            if(avgMinutes < 15) paymentSpeed = '<15 min';
            else if (avgMinutes < 60) paymentSpeed = '<1 hr';
            else paymentSpeed = `+${Math.floor(avgMinutes / 60)} hr`;
        }
        return { reputation, effectiveness, responseTime, paymentSpeed };
    }, []);

    const getAgendaEvents = useCallback((agendaTransactions: Transaction[]) => {
      return agendaTransactions.filter(tx => tx.status === 'Finalizado - Pendiente de Pago').map(tx => ({
        date: new Date(tx.date), type: 'payment', description: `Pago a ${tx.providerId}`, transactionId: tx.id,
      }));
    }, []);

    const value: CoraboContextValue = {
        currentUser,
        users, allPublications, transactions, conversations, cart, searchQuery, categoryFilter, contacts, isGpsActive, searchHistory, 
        deliveryAddress, exchangeRate, qrSession, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
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
