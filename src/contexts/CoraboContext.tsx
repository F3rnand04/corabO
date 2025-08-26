
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User, CartItem, Transaction, GalleryImage, Conversation, TempRecipientInfo, FirebaseUserInput } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirestoreDb }from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { haversineDistance } from '@/lib/utils';
import { credicoraLevels, credicoraCompanyLevels } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import * as Actions from '@/lib/actions';


interface CoraboContextValue {
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
  currentUserLocation: any;
  tempRecipientInfo: TempRecipientInfo | null;
  activeCartForCheckout: CartItem[] | null;
  cart: CartItem[];
  qrSession: any;

  fetchUser: (userId: string) => User | null;
  getUserMetrics: (userId: string) => {
    reputation: number;
    effectiveness: number;
    responseTime: string;
    paymentSpeed: string | null;
  };
  setSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  setCategoryFilter: (category: string | null) => void;
  addContact: (user: User) => boolean;
  isContact: (userId: string) => boolean;
  removeContact: (userId: string) => void;

  getDistanceToProvider: (provider: User) => string | null;
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  getAgendaEvents: (transactions: Transaction[]) => any[];
  setCurrentUser: (user: User | null) => void;
}

export const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);

interface CoraboProviderProps {
    children: ReactNode;
}

export const CoraboProvider = ({ children }: CoraboProviderProps) => {
  const { firebaseUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Real-time data states
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  
  // UI and Search states
  const [searchQuery, _setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Local state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [deliveryAddress, _setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [tempRecipientInfo, _setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  const [qrSession, setQrSession] = useState<any>(null);

  useEffect(() => {
    if (isLoadingAuth) return;
    
    if (!firebaseUser) {
        setCurrentUser(null);
        setIsLoadingUser(false);
        return;
    }
    
    const db = getFirestoreDb();
    
    const userUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
        if(docSnap.exists()){
            setCurrentUser(docSnap.data() as User);
        } else {
            // This might happen briefly if Firestore creation is slow
            console.log("Waiting for user document to be created...");
        }
        setIsLoadingUser(false);
    });

    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
    });
    
    const pubsUnsub = onSnapshot(collection(db, 'publications'), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    });
    
    const convosQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', firebaseUser.uid));
    const convosUnsub = onSnapshot(convosQuery, (snapshot) => {
        setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
    });

    const transQuery = query(collection(db, 'transactions'), where('participantIds', 'array-contains', firebaseUser.uid));
    const transUnsub = onSnapshot(transQuery, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    });

    return () => {
        userUnsub();
        usersUnsub();
        pubsUnsub();
        convosUnsub();
        transUnsub();
    };

  }, [firebaseUser, isLoadingAuth]);
  
  const getUserMetrics = useCallback((userId: string) => {
    const userTransactions = transactions.filter(tx => tx.providerId === userId || tx.clientId === userId);
    
    const ratedTransactions = userTransactions.filter(tx => tx.providerId === userId && tx.details.clientRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    const relevantTransactions = userTransactions.filter(tx => tx.type !== 'Sistema' && tx.status !== 'Carrito Activo');
    const successfulTransactions = relevantTransactions.filter(tx => tx.status === 'Pagado' || tx.status === 'Resuelto');
    const effectiveness = relevantTransactions.length > 0 ? (successfulTransactions.length / relevantTransactions.length) * 100 : 100;
    
    const quoteRequests = userTransactions.filter(tx => tx.providerId === userId && tx.status === 'Cotización Recibida');
    const responseTime = quoteRequests.length > 5 ? 'Rápido' : (userTransactions.length > 0 ? 'Normal' : 'N/A');

    const paidByClientTransactions = userTransactions.filter(tx => tx.providerId === userId && tx.status === 'Pagado' && tx.details.paymentSentAt && tx.details.paymentConfirmationDate);
    let totalPaymentMinutes = 0;
    paidByClientTransactions.forEach(tx => {
        if (tx.details.paymentSentAt && tx.details.paymentConfirmationDate) {
            totalPaymentMinutes += differenceInMinutes(new Date(tx.details.paymentConfirmationDate), new Date(tx.details.paymentSentAt));
        }
    });
    const avgPaymentMinutes = paidByClientTransactions.length > 0 ? totalPaymentMinutes / paidByClientTransactions.length : 0;
    
    let paymentSpeed: string | null = null;
    if (paidByClientTransactions.length > 0) {
        if (avgPaymentMinutes <= 5) paymentSpeed = '0-5 min';
        else if (avgPaymentMinutes <= 15) paymentSpeed = '5-15 min';
        else paymentSpeed = '+45 min';
    }

    return { reputation, effectiveness, responseTime, paymentSpeed };
  }, [transactions]);
  
  const getCartItems = useMemo((): CartItem[] => {
      const cartTx = transactions.find(tx => tx.status === 'Carrito Activo');
      return cartTx?.details.items || [];
  }, [transactions]);

  const value: CoraboContextValue = {
    currentUser, isLoadingUser,
    users, transactions, conversations, allPublications,
    searchQuery, categoryFilter, contacts, searchHistory, 
    deliveryAddress, exchangeRate, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    cart: getCartItems, qrSession,
    setCurrentUser,
    setSearchQuery: (query: string) => _setSearchQuery(query),
    setCategoryFilter,
    clearSearchHistory: () => setSearchHistory([]),
    addContact: (user: User) => { console.log("addContact no-op"); return false; },
    removeContact: (userId: string) => { console.log("removeContact no-op"); },
    isContact: (userId: string) => false,
    getAgendaEvents: () => [],
    setDeliveryAddress: _setDeliveryAddress,
    setDeliveryAddressToCurrent: () => {},
    getUserMetrics,
    fetchUser: (userId: string) => users.find(u => u.id === userId) || null,
    getDistanceToProvider: () => '5 km',
    setTempRecipientInfo: _setTempRecipientInfo,
    setActiveCartForCheckout,
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
};
