
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { addDays } from 'date-fns';
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
  isLoadingAuth: boolean;

  // Actions
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
  // Acciones que llaman al backend
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserProfileImage: (userId: string, imageUrl: string) => Promise<void>;
  toggleGps: (userId: string) => Promise<void>;
  updateFullProfile: (userId: string, data: ProfileSetupData, profileType: User['type']) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserPause: (userId: string, currentIsPaused: boolean) => Promise<void>;
  sendPhoneVerification: (userId: string, phone: string) => Promise<void>;
  verifyPhoneCode: (userId: string, code: string) => Promise<boolean>;
  autoVerifyIdWithAI: (user: User) => Promise<VerificationOutput>;
  verifyUserId: (userId: string) => Promise<void>;
  rejectUserId: (userId: string) => Promise<void>;
  createPublication: (data: CreatePublicationInput) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<string>;
  removeGalleryImage: (userId: string, imageId: string) => Promise<void>;
  updateGalleryImage: (ownerId: string, imageId: string, updates: Partial<{ description: string, imageDataUri: string }>) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  checkout: (providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: TempRecipientInfo) => Promise<void>;
  sendMessage: (options: any) => Promise<string>;
  acceptProposal: (conversationId: string, messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  createCampaign: (data: Omit<any, 'userId'>) => Promise<any>;
  activatePromotion: (details: { imageId: string; promotionText: string; cost: number; }) => Promise<void>;
  verifyCampaignPayment: (transactionId: string, campaignId: string) => Promise<void>;
  approveAffiliation: (affiliationId: string) => Promise<void>;
  rejectAffiliation: (affiliationId: string) => Promise<void>;
  revokeAffiliation: (affiliationId: string) => Promise<void>;
  startQrSession: (providerId: string, cashierBoxId?: string) => Promise<string | null>;
  cancelQrSession: (sessionId: string) => Promise<void>;
  setQrSessionAmount: (sessionId: string, amount: number) => Promise<void>;
  handleClientCopyAndPay: (sessionId: string) => Promise<void>;
  confirmMobilePayment: (sessionId: string) => Promise<void>;
  addCashierBox: (name: string, password: string) => Promise<void>;
  removeCashierBox: (boxId: string) => Promise<void>;
  updateCashierBox: (boxId: string, updates: Partial<CashierBox>) => Promise<void>;
  regenerateCashierBoxQr: (boxId: string) => Promise<void>;
  sendQuote: (transactionId: string, quote: { breakdown: string, total: number }) => Promise<void>;
  acceptQuote: (transactionId: string) => Promise<void>;
  startDispute: (transactionId: string) => Promise<void>;
  completeWork: (transactionId: string) => Promise<void>;
  confirmWorkReceived: (transactionId: string, rating: number, comment: string) => Promise<void>;
  confirmPaymentReceived: (transactionId: string, fromThirdParty: boolean) => Promise<void>;
  payCommitment: (transactionId: string, paymentDetails?: any) => Promise<void>;
  createAppointmentRequest: (request: Omit<AppointmentRequest, 'clientId'>) => Promise<void>;
  acceptAppointment: (transactionId: string) => Promise<void>;
  subscribeUser: (userId: string, planName: string, amount: number) => Promise<void>;
  registerSystemPayment: (concept: string, amount: number, isSubscription: boolean) => Promise<void>;
  deactivateTransactions: (userId: string) => Promise<void>;
  cancelSystemTransaction: (transactionId: string) => Promise<void>;
  downloadTransactionsPDF: (transactions: Transaction[], startDate: Date, endDate: Date) => Promise<void>;
  retryFindDelivery: (transactionId: string) => Promise<void>;
  assignOwnDelivery: (transactionId: string) => Promise<void>;
  resolveDeliveryAsPickup: (transactionId: string) => Promise<void>;
  requestQuoteFromGroup: (title: string, items: string[], group: string) => boolean;
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
        return await Actions.getPublicProfile(userId);
  }, []);

  useEffect(() => {
    const db = getFirestoreDb();
    const unsubscribes: Unsubscribe[] = [];

    // This listener can be outside the currentUser check as it fetches all users
    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as User)
        setUsers(userList);
        userList.forEach(user => userCache.current.set(user.id, user));
    }));
    
    // This listener can also be outside, fetching all public publications
    unsubscribes.push(onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    }));
    
    // These listeners DEPEND on the currentUser ID.
    if (currentUser?.id) {
        unsubscribes.push(onSnapshot(query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id)), (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))));
        unsubscribes.push(onSnapshot(query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id), orderBy("lastUpdated", "desc")), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation))));
        unsubscribes.push(onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null)));
    } else {
        // If there's no user, clear the personalized data
        setTransactions([]);
        setConversations([]);
        setQrSession(null);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.id]); // Depend only on the user's ID
  
  const getCartTotal = useCallback((cartItems: CartItem[] = cart) => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  
  const getDistanceToProvider = useCallback((provider: User) => {
      if (!currentUserLocation || !provider.profileSetupData?.location) return null;
      const [lat2, lon2] = provider.profileSetupData.location.split(',').map(Number);
      const distanceKm = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat2, lon2);
      if (provider.profileSetupData.showExactLocation === false) return `${Math.max(1, Math.round(distanceKm))} km`;
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
    
    const updateCartQuantity = async (productId: string, quantity: number) => {
        if (!currentUser) return;
        const newCart = [...cart];
        const itemIndex = newCart.findIndex(item => item.product.id === productId);
        if (itemIndex > -1) {
            if (quantity > 0) newCart[itemIndex].quantity = quantity;
            else newCart.splice(itemIndex, 1);
        }
        await Actions.updateCart(currentUser.id, newCart);
    };

    const addToCart = async (product: Product, quantity: number) => {
        if (!currentUser) return;
        const newCart = [...cart];
        const itemIndex = newCart.findIndex(item => item.product.id === product.id);
        if (itemIndex > -1) newCart[itemIndex].quantity += quantity;
        else newCart.push({ product, quantity });
        await Actions.updateCart(currentUser.id, newCart);
    };
    
    const checkout = async (providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: TempRecipientInfo) => {
        if (!currentUser) return;
        await Actions.checkout(currentUser.id, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress);
    };

    const sendMessage = async (options: any): Promise<string> => {
        if (!currentUser) throw new Error("User not authenticated");
        const conversationId = [currentUser.id, options.recipientId].sort().join('-');
        await Actions.sendMessage({ conversationId, senderId: currentUser.id, ...options });
        return conversationId;
    };

    const acceptProposal = async (conversationId: string, messageId: string) => {
        if (!currentUser) return;
        await Actions.acceptProposal(conversationId, messageId, currentUser.id);
    };

    const markConversationAsRead = async (conversationId: string) => {
        if (!currentUser) return;
        await Actions.markConversationAsRead(conversationId, currentUser.id);
    };
    
    const subscribeUser = async (userId: string, planName: string, amount: number) => {
        await Actions.registerSystemPayment(userId, `Suscripción: ${planName}`, amount, true);
    }

  const value = {
    currentUser,
    isLoadingAuth: !currentUser, // Simplified loading state based on user presence
    users, allPublications, transactions, conversations, cart, searchQuery, categoryFilter, contacts, isGpsActive, searchHistory, 
    deliveryAddress, exchangeRate, qrSession, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    setSearchQuery: (query: string) => {
        _setSearchQuery(query);
        if (query.trim() && !searchHistory.includes(query.trim())) setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
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
    updateUser: (userId: string, updates: Partial<User>) => Actions.updateUser(userId, updates),
    updateUserProfileImage: (userId: string, imageUrl: string) => Actions.updateUserProfileImage(userId, imageUrl),
    toggleGps: async (userId: string) => {
      if(!currentUser) return;
      await Actions.toggleGps(userId, currentUser.isGpsActive);
    },
    updateFullProfile: (userId: string, data: ProfileSetupData, profileType: User['type']) => Actions.updateFullProfile(userId, data, profileType),
    deleteUser: (userId: string) => Actions.deleteUser(userId),
    toggleUserPause: (userId: string, currentIsPaused: boolean) => Actions.toggleUserPause(userId, currentIsPaused),
    sendPhoneVerification: (userId: string, phone: string) => Actions.sendPhoneVerification(userId, phone),
    verifyPhoneCode: (userId: string, code: string) => Actions.verifyPhoneCode(userId, code),
    autoVerifyIdWithAI: (user: User) => Actions.autoVerifyIdWithAI(user),
    verifyUserId: (userId: string) => Actions.verifyUserId(userId),
    rejectUserId: (userId: string) => Actions.rejectUserId(userId),
    createPublication: (data: CreatePublicationInput) => Actions.createPublication(data),
    createProduct: (data: CreateProductInput) => Actions.createProduct(data),
    removeGalleryImage: (userId: string, imageId: string) => Actions.removeGalleryImage(userId, imageId),
    updateGalleryImage: (ownerId: string, imageId: string, updates: Partial<{ description: string, imageDataUri: string }>) => Actions.updateGalleryImage(ownerId, imageId, updates),
    updateCartQuantity,
    checkout,
    sendMessage,
    acceptProposal,
    markConversationAsRead,
    createCampaign: (data: Omit<any, 'userId'>) => Actions.createCampaign(currentUser!.id, data),
    activatePromotion: (details: any) => Actions.activatePromotion(currentUser!.id, details),
    verifyCampaignPayment: (transactionId: string, campaignId: string) => Actions.verifyCampaignPayment(transactionId, campaignId),
    approveAffiliation: (affiliationId: string) => Actions.approveAffiliation(affiliationId, currentUser!.id),
    rejectAffiliation: (affiliationId: string) => Actions.rejectAffiliation(affiliationId, currentUser!.id),
    revokeAffiliation: (affiliationId: string) => Actions.revokeAffiliation(affiliationId, currentUser!.id),
    startQrSession: async (providerId: string, cashierBoxId?: string) => {
        if (!currentUser) return null;
        return await Actions.startQrSession(currentUser.id, providerId, cashierBoxId);
    },
    cancelQrSession: (sessionId: string) => Actions.cancelQrSession(sessionId),
    setQrSessionAmount: async (sessionId: string, amount: number) => {
        if(!currentUser) return;
        const level = currentUser.credicoraLevel || 1;
        const details = currentUser.credicoraDetails || { initialPaymentPercentage: 0.6, installments: 3 };
        const financed = Math.min(amount * (1 - details.initialPaymentPercentage), currentUser.credicoraLimit || 0);
        await Actions.setQrSessionAmount(sessionId, amount, amount - financed, financed, details.installments);
    },
    handleClientCopyAndPay: (sessionId: string) => Actions.handleClientCopyAndPay(sessionId),
    confirmMobilePayment: (sessionId: string) => Actions.confirmMobilePayment(sessionId),
    addCashierBox: (name: string, password: string) => Actions.addCashierBox(currentUser!.id, name, password),
    removeCashierBox: (boxId: string) => Actions.removeCashierBox(currentUser!.id, boxId),
    updateCashierBox: (boxId: string, updates: Partial<CashierBox>) => Actions.updateCashierBox(currentUser!.id, boxId, updates),
    regenerateCashierBoxQr: (boxId: string) => Actions.regenerateCashierBoxQr(currentUser!.id, boxId),
    sendQuote: (transactionId: string, quote: { breakdown: string, total: number }) => Actions.sendQuote(transactionId, currentUser!.id, quote.breakdown, quote.total),
    acceptQuote: (transactionId: string) => Actions.acceptQuote(transactionId, currentUser!.id),
    startDispute: (transactionId: string) => Actions.startDispute(transactionId),
    completeWork: (transactionId: string) => Actions.completeWork(transactionId, currentUser!.id),
    confirmWorkReceived: (transactionId: string, rating: number, comment: string) => Actions.confirmWorkReceived(transactionId, currentUser!.id, rating, comment),
    confirmPaymentReceived: (transactionId: string, fromThirdParty: boolean) => Actions.confirmPaymentReceived(transactionId, currentUser!.id, fromThirdParty),
    payCommitment: (transactionId: string, paymentDetails?: any) => Actions.payCommitment(transactionId, currentUser!.id, paymentDetails),
    createAppointmentRequest: (request: Omit<AppointmentRequest, 'clientId'>) => Actions.createAppointmentRequest({ ...request, clientId: currentUser!.id }),
    acceptAppointment: (transactionId: string) => Actions.acceptAppointment(transactionId, currentUser!.id),
    subscribeUser,
    registerSystemPayment: (concept: string, amount: number, isSubscription: boolean) => Actions.registerSystemPayment(currentUser!.id, concept, amount, isSubscription),
    deactivateTransactions: (userId: string) => Actions.updateUser(userId, { isTransactionsActive: false }),
    cancelSystemTransaction: (transactionId: string) => Actions.cancelSystemTransaction(transactionId),
    downloadTransactionsPDF: (transactions: Transaction[], startDate: Date, endDate: Date) => {}, // Placeholder
    retryFindDelivery: (transactionId: string) => Actions.retryFindDelivery({transactionId}),
    assignOwnDelivery: (transactionId: string) => Actions.assignOwnDelivery(transactionId, currentUser!.id),
    resolveDeliveryAsPickup: (transactionId: string) => Actions.resolveDeliveryAsPickup({transactionId}),
    requestQuoteFromGroup: (title: string, items: string[], group: string) => { return true; },
  };
  
  return (
    <CoraboContext.Provider value={value as any}>
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
