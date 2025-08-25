
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { differenceInHours, formatDistanceToNowStrict } from 'date-fns';
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
      return { reputation: 5.0, effectiveness: 100, responseTime: 'Nuevo', paymentSpeed: null };
    }

    // Reputation (as provider)
    const ratedTransactions = userTransactions.filter(tx => tx.providerId === userId && tx.details.clientRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    // Effectiveness (as provider)
    const providerAgreements = userTransactions.filter(tx => tx.providerId === userId && (tx.type === 'Servicio' || tx.type === 'Compra Directa'));
    const completedAgreements = providerAgreements.filter(tx => tx.status === 'Pagado' || tx.status === 'Resuelto');
    const effectiveness = providerAgreements.length > 0 ? (completedAgreements.length / providerAgreements.length) * 100 : 100;
    
    // Response Time (as provider)
    const quoteRequests = userTransactions.filter(tx => tx.providerId === userId && tx.status === 'Cotización Recibida');
    // NOTE: This is a simplified simulation. A real implementation would compare request and response timestamps.
    const responseTime = quoteRequests.length > 5 ? 'Rápido' : 'Normal';

    // Payment Speed (as client)
    const paidTransactions = userTransactions.filter(tx => tx.clientId === userId && tx.status === 'Pagado');
    let totalPaymentHours = 0;
    paidTransactions.forEach(tx => {
        if (tx.details.paymentRequestedAt && tx.details.paymentSentAt) {
            totalPaymentHours += differenceInHours(new Date(tx.details.paymentSentAt), new Date(tx.details.paymentRequestedAt));
        }
    });
    const avgPaymentHours = paidTransactions.length > 0 ? totalPaymentHours / paidTransactions.length : 0;
    
    let paymentSpeed: string | null = null;
    if (paidTransactions.length > 0) {
        if (avgPaymentHours <= 1) paymentSpeed = '< 1 hr';
        else if (avgPaymentHours <= 24) paymentSpeed = '< 24 hrs';
        else paymentSpeed = `+${Math.round(avgPaymentHours / 24)} días`;
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
