
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User, CartItem, Transaction, GalleryImage, Conversation, TempRecipientInfo, FirebaseUserInput } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';

// --- MOCK DATA TO FORCE RENDER ---
const mockUser: User = {
  id: 'user_placeholder_id',
  coraboId: 'corabo123',
  name: 'Usuario de Prueba',
  lastName: 'Corabo',
  email: 'test@corabo.app',
  profileImage: 'https://i.pravatar.cc/150?u=user_placeholder_id',
  type: 'client',
  reputation: 5,
  effectiveness: 100,
  isInitialSetupComplete: true,
  isTransactionsActive: true,
  emailValidated: true,
  phoneValidated: true,
  isGpsActive: true,
  isSubscribed: true,
  credicoraLevel: 1,
  credicoraLimit: 150,
  credicoraDetails: {
    level: 1,
    name: 'Alfa',
    color: '210 90% 54%',
    creditLimit: 150,
    initialPaymentPercentage: 0.60,
    installments: 3,
    transactionsForNextLevel: 25,
  },
  profileSetupData: {
      username: 'Usuario de Prueba',
      specialty: 'Probando la plataforma',
      providerType: 'professional',
      offerType: 'both'
  }
};
// --- END MOCK DATA ---

interface CoraboContextValue {
  currentUser: User | null;
  isLoadingUser: boolean; 
  syncCoraboUser: (fbUser: FirebaseUser | null) => Promise<void>;
  
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
  // We force the user to be loaded and set a mock user.
  const [currentUser, setCurrentUser] = useState<User | null>(mockUser);
  const [isLoadingUser, setIsLoadingUser] = useState(false); // FORCED TO FALSE

  // The rest of the state remains for the app to function minimally
  const [users, setUsers] = useState<User[]>([mockUser]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [deliveryAddress, _setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [tempRecipientInfo, _setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  const [qrSession, setQrSession] = useState<any>(null);

  // This function is now a no-op but needs to exist for AuthProvider
  const syncCoraboUser = useCallback(async (fbUser: FirebaseUser | null) => {
    console.log("syncCoraboUser called, but is currently a no-op.");
  }, []);
  
  const getUserMetrics = useCallback((userId: string) => {
    const userTransactions = transactions.filter(tx => tx.providerId === userId || tx.clientId === userId);

    if (userTransactions.length === 0) {
        // **FIX**: Return a full metrics object with default values for new users
        return { 
            reputation: 5.0, 
            effectiveness: 100, 
            responseTime: 'N/A', // Use 'N/A' to indicate not applicable yet
            paymentSpeed: null 
        };
    }

    // Reputation (as provider)
    const ratedTransactions = userTransactions.filter(tx => tx.providerId === userId && tx.details.clientRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    // Effectiveness
    const relevantTransactions = userTransactions.filter(tx => tx.type !== 'Sistema' && tx.status !== 'Carrito Activo');
    const successfulTransactions = relevantTransactions.filter(tx => tx.status === 'Pagado' || tx.status === 'Resuelto');
    const effectiveness = relevantTransactions.length > 0 ? (successfulTransactions.length / relevantTransactions.length) * 100 : 100;
    
    // Response Time (as provider, simulated)
    const quoteRequests = userTransactions.filter(tx => tx.providerId === userId && tx.status === 'Cotización Recibida');
    const responseTime = quoteRequests.length > 5 ? 'Rápido' : 'Normal';

    // Payment Speed (as provider, confirming payments)
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
  
  const value: CoraboContextValue = {
    currentUser, isLoadingUser, syncCoraboUser,
    users, transactions, conversations, allPublications,
    searchQuery, categoryFilter, contacts, searchHistory, 
    deliveryAddress, exchangeRate, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    cart: [], qrSession,
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
    fetchUser: () => mockUser,
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
