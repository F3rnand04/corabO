
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, Unsubscribe, updateDoc, writeBatch } from 'firebase/firestore';
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
  getUserMetrics: (userId: string) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  getDistanceToProvider: (provider: User) => string | null;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  
  // Refactored Actions (moved out, just keeping for reference)
  // These are now called from @/lib/actions
  sendMessage: (options: Omit<SendMessageInput, 'senderId'> & { conversationId?: string }) => string;
  createPublication: (data: CreatePublicationInput) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<string>;
  updateUserProfileImage: (userId: string, imageUrl: string) => Promise<void>;
  toggleGps: (userId: string) => Promise<void>;
  addCashierBox: (name: string, password: string) => Promise<void>;
  removeCashierBox: (boxId: string) => Promise<void>;
  updateCashierBox: (boxId: string, updates: Partial<Pick<CashierBox, "name" | "passwordHash">>) => Promise<void>;
  regenerateCashierBoxQr: (boxId: string) => Promise<void>;
  startQrSession: (providerId: string, cashierBoxId?: string) => Promise<string>;
  cancelQrSession: (sessionId: string) => Promise<void>;
  setQrSessionAmount: (sessionId: string, amount: number) => Promise<void>;
  handleClientCopyAndPay: (sessionId: string) => Promise<void>;
  confirmMobilePayment: (sessionId: string) => Promise<void>;
  subscribeUser: (title: string, amount: number) => Promise<void>;
  updateFullProfile: (data: ProfileSetupData) => Promise<void>;
  deactivateTransactions: () => Promise<void>;
  activateTransactions: (paymentDetails: ProfileSetupData['paymentDetails']) => Promise<void>;
  approveAffiliation: (affiliationId: string) => Promise<void>;
  rejectAffiliation: (affiliationId: string) => Promise<void>;
  revokeAffiliation: (affiliationId: string) => Promise<void>;
  verifyCampaignPayment: (transactionId: string, campaignId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserPause: (userId: string, currentIsPaused: boolean) => Promise<void>;
  verifyUserId: (userId: string) => Promise<void>;
  rejectUserId: (userId: string) => Promise<void>;
  autoVerifyIdWithAI: (user: User) => Promise<VerificationOutput>;
  requestQuoteFromGroup: (title: string, items: string[], group: string) => boolean;
  createCampaign: (data: Omit<CreateCampaignInput, 'userId'>) => Promise<void>;
  createAppointmentRequest: (data: Omit<AppointmentRequest, 'clientId'>) => Promise<void>;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => Promise<void>;
  acceptProposal: (conversationId: string, messageId: string) => Promise<void>;
  sendQuote: (transactionId: string, quote: { breakdown: string; total: number; }) => Promise<void>;
  acceptQuote: (transactionId: string) => Promise<void>;
  startDispute: (transactionId: string) => Promise<void>;
  completeWork: (transactionId: string) => Promise<void>;
  confirmWorkReceived: (transactionId: string, rating: number, comment?: string) => Promise<void>;
  payCommitment: (transactionId: string) => Promise<void>;
  confirmPaymentReceived: (transactionId: string, fromThirdParty: boolean) => Promise<void>;
  acceptAppointment: (transactionId: string) => Promise<void>;
  cancelSystemTransaction: (transactionId: string) => Promise<void>;
  retryFindDelivery: (transactionId: string) => Promise<void>;
  assignOwnDelivery: (transactionId: string) => Promise<void>;
  resolveDeliveryAsPickup: (transactionId: string) => Promise<void>;
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

    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    }));
    unsubscribes.push(onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    }));

    if (currentUser?.id) {
        const userId = currentUser.id;
        const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", userId));
        const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", userId), orderBy("lastUpdated", "desc"));
        const qrSessionQuery = query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', userId));

        unsubscribes.push(onSnapshot(transactionsQuery, (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))));
        unsubscribes.push(onSnapshot(conversationsQuery, (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation))));
        unsubscribes.push(onSnapshot(qrSessionQuery, (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null)));
    } else {
        setTransactions([]);
        setConversations([]);
        setQrSession(null);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.id]);
  
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
        date: new Date(tx.date), type: 'payment', description: `Pago a ${tx.providerId}`, transactionId: tx.id,
      }));
    }, []);

    const sendMessageWrapper = (options: Omit<SendMessageInput, 'senderId'> & { conversationId?: string }): string => {
        if (!currentUser) throw new Error("User not logged in");
        const finalConversationId = options.conversationId || [currentUser.id, options.recipientId].sort().join('-');
        Actions.sendMessage({ ...options, senderId: currentUser.id, conversationId: finalConversationId });
        return finalConversationId;
    }
    
    const requestQuoteFromGroupWrapper = (title: string, items: string[], group: string): boolean => {
      if (!currentUser) return false;
      const requestSignature = items.sort().join('|') + `|${group}`;
      const today = new Date().toISOString().split('T')[0];
      const todaysQuotes = dailyQuotes.filter(q => q.requestSignature.startsWith(today));
      const existingQuote = todaysQuotes.find(q => q.requestSignature.endsWith(requestSignature));

      if (existingQuote && existingQuote.count >= 3 && !currentUser.isSubscribed) {
          return false;
      }
      const newDailyQuotes = [...todaysQuotes];
      if (existingQuote) {
          existingQuote.count++;
      } else {
          newDailyQuotes.push({ requestSignature: `${today}|${requestSignature}`, count: 1 });
      }
      setDailyQuotes(newDailyQuotes);
      Actions.requestQuoteFromGroup({ clientId: currentUser.id, title, items, group });
      return true;
  };

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
        // Bind actions to the current user
        sendMessage: sendMessageWrapper,
        createPublication: (data) => { if (currentUser) Actions.createPublication(data) },
        createProduct: (data) => { if (currentUser) return Actions.createProduct(data) },
        updateUserProfileImage: (userId, imageUrl) => Actions.updateUserProfileImage(userId, imageUrl),
        toggleGps: (userId) => Actions.toggleGps(userId, isGpsActive),
        addCashierBox: (name, password) => { if (currentUser) Actions.addCashierBox(currentUser.id, name, password) },
        removeCashierBox: (boxId) => { if (currentUser) Actions.removeCashierBox(currentUser.id, boxId) },
        updateCashierBox: (boxId, updates) => { if (currentUser) Actions.updateCashierBox(currentUser.id, boxId, updates) },
        regenerateCashierBoxQr: (boxId) => { if (currentUser) Actions.regenerateCashierBoxQr(currentUser.id, boxId) },
        startQrSession: (providerId, cashierBoxId) => { if (currentUser) return Actions.startQrSession(currentUser.id, providerId, cashierBoxId) },
        cancelQrSession: Actions.cancelQrSession,
        setQrSessionAmount: (sessionId, amount) => {
            if(!currentUser) return;
            const credicoraDetails = currentUser.credicoraDetails || credicoraLevels['1'];
            const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
            const financedAmount = Math.min(amount * financingPercentage, currentUser.credicoraLimit || 0);
            const initialPayment = amount - financedAmount;
            Actions.setQrSessionAmount(sessionId, amount, initialPayment, financedAmount, credicoraDetails.installments)
        },
        handleClientCopyAndPay: Actions.handleClientCopyAndPay,
        confirmMobilePayment: async (sessionId: string) => {
          const session = qrSession?.id === sessionId ? qrSession : null;
          if(!session) return;
          const { transactionId } = await Actions.processDirectPayment({ sessionId });
          // Update the session in Firestore to mark it as completed
          const db = getFirestoreDb();
          await updateDoc(doc(db, "qr_sessions", sessionId), { status: 'completed' });
        },
        subscribeUser: (title, amount) => { if (currentUser) Actions.registerSystemPayment(currentUser.id, title, amount, true); },
        updateFullProfile: (data) => { if (currentUser) Actions.updateFullProfile(currentUser.id, data, currentUser.type); },
        deactivateTransactions: async () => {
            if (currentUser) {
                await Actions.updateUser(currentUser.id, { isTransactionsActive: false, 'profileSetupData.paymentDetails': deleteField() as any });
                toast({ title: 'Registro Desactivado', description: 'Has desactivado tu módulo de transacciones.' });
            }
        },
        activateTransactions: async (paymentDetails) => {
             if (currentUser) {
                await Actions.updateUser(currentUser.id, { isTransactionsActive: true, 'profileSetupData.paymentDetails': paymentDetails });
                toast({ title: '¡Registro Activado!', description: 'Tu módulo de transacciones está activo.' });
            }
        },
        approveAffiliation: (affiliationId) => { if(currentUser) return Actions.approveAffiliation(affiliationId, currentUser.id) },
        rejectAffiliation: (affiliationId) => { if(currentUser) return Actions.rejectAffiliation(affiliationId, currentUser.id) },
        revokeAffiliation: (affiliationId) => { if(currentUser) return Actions.revokeAffiliation(affiliationId, currentUser.id) },
        verifyCampaignPayment: Actions.verifyCampaignPayment,
        deleteUser: Actions.deleteUser,
        toggleUserPause: Actions.toggleUserPause,
        verifyUserId: Actions.verifyUserId,
        rejectUserId: Actions.rejectUserId,
        autoVerifyIdWithAI: Actions.autoVerifyIdWithAI,
        requestQuoteFromGroup: requestQuoteFromGroupWrapper,
        createCampaign: (data) => { if (currentUser) return Actions.createCampaign(currentUser.id, data) },
        createAppointmentRequest: (data) => { if (currentUser) return Actions.createAppointmentRequest({ ...data, clientId: currentUser.id }) },
        sendProposalMessage: (conversationId, proposal) => { if (currentUser) return Actions.sendMessage({ conversationId, recipientId: '', senderId: currentUser.id, proposal }) },
        acceptProposal: (conversationId, messageId) => { if (currentUser) return Actions.acceptProposal(conversationId, messageId, currentUser.id) },
        sendQuote: Actions.sendQuote,
        acceptQuote: (transactionId) => { if (currentUser) return Actions.acceptQuote(transactionId, currentUser.id) },
        startDispute: Actions.startDispute,
        completeWork: (transactionId) => { if(currentUser) return Actions.completeWork({ transactionId, userId: currentUser.id }) },
        confirmWorkReceived: (transactionId, rating, comment) => { if(currentUser) return Actions.confirmWorkReceived({ transactionId, userId: currentUser.id, rating, comment }) },
        payCommitment: (transactionId) => { if(currentUser) return Actions.payCommitment(transactionId, currentUser.id, {}) },
        confirmPaymentReceived: (transactionId, fromThirdParty) => { if(currentUser) return Actions.confirmPaymentReceived({ transactionId, userId: currentUser.id, fromThirdParty }) },
        acceptAppointment: (transactionId) => { if(currentUser) return Actions.acceptAppointment({ transactionId, userId: currentUser.id }) },
        cancelSystemTransaction: Actions.cancelSystemTransaction,
        retryFindDelivery: Actions.retryFindDelivery,
        assignOwnDelivery: (transactionId) => { if(currentUser) return Actions.assignOwnDelivery(transactionId, currentUser.id)},
        resolveDeliveryAsPickup: Actions.resolveDeliveryAsPickup,
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
