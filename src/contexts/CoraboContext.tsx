
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addDays } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { getAuth, signInWithPopup, signOut, User as FirebaseUser, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseApp, getFirestoreDb, getAuthInstance } from '@/lib/firebase';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, arrayUnion, getDocs, deleteDoc, collectionGroup, Unsubscribe, orderBy, deleteField } from 'firebase/firestore';
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { sendMessage as sendMessageFlow, acceptProposal as acceptProposalFlow } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow, type VerificationInput } from '@/ai/flows/verification-flow';
import { getExchangeRate as getExchangeRateFlow } from '@/ai/flows/exchange-rate-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { createProduct as createProductFlow, createPublication as createPublicationFlow } from '@/ai/flows/publication-flow';
import { completeInitialSetupFlow, getPublicProfileFlow, deleteUserFlow, getProfileGallery, getProfileProducts, checkIdUniquenessFlow } from '@/ai/flows/profile-flow';
import { haversineDistance } from '@/lib/utils';
import { getOrCreateUser, type FirebaseUserInput } from '@/ai/flows/auth-flow';
import { requestAffiliation as requestAffiliationFlow, approveAffiliation as approveAffiliationFlow, rejectAffiliation as rejectAffiliationFlow, revokeAffiliation as revokeAffiliationFlow } from '@/ai/flows/affiliation-flow';
import { getEta } from '@/ai/flows/directions-flow';

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


interface CoraboState {
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
  isLoadingAuth: boolean;
  deliveryAddress: string;
  exchangeRate: number;
  qrSession: QrSession | null;
  currentUserLocation: GeolocationCoords | null;
}

interface CoraboActions {
  signInWithGoogle: () => void;
  setCurrentUser: (user: User | null) => void;
  setIsLoadingAuth: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  clearSearchHistory: () => void;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  getDeliveryCost: () => number;
  checkout: (transactionId: string, withDelivery: boolean, useCredicora: boolean) => void;
  addContact: (user: User) => boolean;
  removeContact: (userId: string) => void;
  isContact: (userId: string) => boolean;
  toggleGps: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserProfileImage: (userId: string, imageUrl: string) => Promise<void>;
  removeGalleryImage: (userId: string, imageId: string) => Promise<void>;
  validateEmail: (userId: string, emailToValidate: string) => Promise<boolean>;
  sendPhoneVerification: (userId: string, phone: string) => Promise<void>;
  verifyPhoneCode: (userId: string, code: string) => Promise<boolean>;
  updateFullProfile: (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider' | 'repartidor') => Promise<void>;
  subscribeUser: (userId: string, planName: string, amount: number) => void;
  activateTransactions: (userId: string, paymentDetails: any) => Promise<void>;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: (transactions: Transaction[]) => void;
  sendMessage: (options: { recipientId: string; text?: string; createOnly?: boolean; location?: { lat: number, lon: number } }) => void;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: Omit<AppointmentRequest, 'clientId'>) => void;
  getAgendaEvents: (transactions: Transaction[]) => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => Promise<void>;
  createCampaign: (data: Omit<CreateCampaignInput, 'userId'>) => Promise<void>;
  createPublication: (data: CreatePublicationInput) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  setDeliveryAddress: (address: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  toggleUserPause: (userId: string, currentIsPaused: boolean) => void;
  deleteUser: (userId: string) => Promise<void>;
  verifyCampaignPayment: (transactionId: string, campaignId: string) => void;
  verifyUserId: (userId: string) => void;
  rejectUserId: (userId: string) => void;
  autoVerifyIdWithAI: (user: User) => Promise<VerificationOutput>;
  getUserMetrics: (userId: string, transactions: Transaction[]) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  acceptDelivery: (transactionId: string) => void;
  getDistanceToProvider: (provider: User) => string | null;
  startQrSession: (providerId: string) => Promise<string | null>;
  setQrSessionAmount: (sessionId: string, amount: number) => Promise<void>;
  approveQrSession: (sessionId: string) => Promise<void>;
  finalizeQrSession: (sessionId: string, voucherUrl: string) => Promise<void>;
  cancelQrSession: (sessionId: string, byProvider?: boolean) => Promise<void>;
  registerSystemPayment: (concept: string, amount: number, isSubscription: boolean) => Promise<void>;
  cancelSystemTransaction: (transactionId: string) => Promise<void>;
  payCommitment: (transactionId: string, paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string; }) => Promise<void>;
  updateUserProfileAndGallery: (userId: string, image: GalleryImage) => Promise<void>;
  requestAffiliation: (providerId: string, companyId: string) => Promise<void>;
  approveAffiliation: (affiliationId: string) => Promise<void>;
  rejectAffiliation: (affiliationId: string) => Promise<void>;
  revokeAffiliation: (affiliationId: string) => Promise<void>;
}

// **DEFINITIVE FIX:** Separating State from Actions to prevent circular references.
// The State context holds only data.
const CoraboStateContext = createContext<CoraboState | undefined>(undefined);
// The Actions context holds only functions.
const CoraboActionsContext = createContext<CoraboActions | undefined>(undefined);


export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  // All state variables are managed here.
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [searchQuery, _setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [deliveryAddress, _setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<GeolocationCoords | null>(null);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  
  const userCache = useRef<Map<string, User>>(new Map());

  const setCurrentUser = useCallback((user: User | null) => {
    _setCurrentUser(user);
  }, []);
  
  const setDeliveryAddress = useCallback((address: string) => {
    localStorage.setItem('coraboDeliveryAddress', address);
    _setDeliveryAddress(address);
  }, []);
  
  const activeCartTx = useMemo(() => transactions.find(tx => tx.status === 'Carrito Activo'), [transactions]);
  const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

  useEffect(() => {
    const savedAddress = localStorage.getItem('coraboDeliveryAddress');
    if (savedAddress) {
        _setDeliveryAddress(savedAddress);
    }
    // **FIX**: Handle geolocation permission gracefully.
    const checkGeolocation = () => {
      if (navigator.geolocation) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (position) => setCurrentUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
              (error) => console.error("Error getting geolocation: ", error)
            );
          } else if (result.state === 'prompt') {
            // It will ask the user, which is fine.
             navigator.geolocation.getCurrentPosition(
              (position) => setCurrentUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
              (error) => console.error("Error getting geolocation: ", error)
            );
          } else if (result.state === 'denied') {
            // **IMPROVEMENT**: Inform the user gracefully.
            toast({
              title: "Permiso de Ubicación Denegado",
              description: "Para ver distancias y usar el mapa, activa los permisos de ubicación en tu navegador.",
              variant: "destructive",
              duration: 10000
            });
          }
        });
      }
    };
    checkGeolocation();
  }, [toast]);


  useEffect(() => {
    // Load contacts from local storage on initial mount
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
    // Save contacts to local storage whenever they change
    localStorage.setItem('coraboContacts', JSON.stringify(contacts));
  }, [contacts]);

  // **STABILIZED DATA LISTENERS EFFECT**
  useEffect(() => {
    const db = getFirestoreDb();
    
    // These listeners are for general data and don't depend on the current user
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
    });
    
    const unsubscribePublications = onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    });

    let unsubscribeUserSpecificData = () => {};

    if (currentUser?.id) {
        const userTransactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
        const userConversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id), orderBy("lastUpdated", "desc"));
        const userQrSessionQuery = query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id));
        
        const unsubscribeTransactions = onSnapshot(userTransactionsQuery, (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction)));
        const unsubscribeConversations = onSnapshot(userConversationsQuery, (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation)));
        const unsubscribeQrSession = onSnapshot(userQrSessionQuery, (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null));

        unsubscribeUserSpecificData = () => {
            unsubscribeTransactions();
            unsubscribeConversations();
            unsubscribeQrSession();
        };
    } else {
        // Clear user-specific data if no user is logged in
        setTransactions([]); 
        setConversations([]); 
    }

    return () => {
        unsubscribeUsers();
        unsubscribePublications();
        unsubscribeUserSpecificData();
    };
}, [currentUser?.id]); // Effect runs only when user ID changes.


  const state = useMemo(() => ({
    currentUser, users, allPublications, transactions, conversations, cart, searchQuery,
    categoryFilter, contacts, isGpsActive, searchHistory, isLoadingAuth,
    deliveryAddress, exchangeRate, qrSession, currentUserLocation
  }), [
    currentUser, users, allPublications, transactions, conversations, cart, searchQuery,
    categoryFilter, contacts, isGpsActive, searchHistory, isLoadingAuth,
    deliveryAddress, exchangeRate, qrSession, currentUserLocation
  ]);
  
  const getCartTotal = useCallback(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  
  const getDistanceToProvider = useCallback((provider: User) => {
    if (!currentUserLocation || !provider.profileSetupData?.location) return null;
    const [lat2, lon2] = provider.profileSetupData.location.split(',').map(Number);
    const distance = haversineDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat2, lon2);
    return distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`;
  }, [currentUserLocation]);
  
  const getDeliveryCost = useCallback(() => ((Math.random() * 9) + 1) * 1.5, []);
  
  const updateCart = useCallback(async (newCart: CartItem[], currentUserId: string, currentTransactions: Transaction[]) => {
      if (!currentUserId) return;
      
      const db = getFirestoreDb();
      let cartTx = currentTransactions.find(tx => tx.status === 'Carrito Activo' && tx.clientId === currentUserId);
      
      if (newCart.length > 0) {
          if (cartTx) {
              const txRef = doc(db, 'transactions', cartTx.id);
              await updateDoc(txRef, { 'details.items': newCart });
          } else {
              const newTxId = `txn-cart-${currentUserId}-${Date.now()}`;
              const providerId = newCart[0].product.providerId;
              const newCartTx: Transaction = {
                  id: newTxId, type: 'Compra', status: 'Carrito Activo', date: new Date().toISOString(), amount: 0,
                  clientId: currentUserId, providerId: providerId, participantIds: [currentUserId, providerId], details: { items: newCart }
              };
              await setDoc(doc(db, 'transactions', newTxId), newCartTx);
          }
      } else if (cartTx) {
          await deleteDoc(doc(db, 'transactions', cartTx.id));
      }
  }, []);
  
  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
      const db = getFirestoreDb();
      await updateDoc(doc(db, 'users', userId), updates);
      // **FIX**: Proactively update the local state to avoid race conditions
      setCurrentUser(prevUser => prevUser && prevUser.id === userId ? { ...prevUser, ...updates } : prevUser);
  }, [setCurrentUser]);

  const updateFullProfile = useCallback(async (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider' | 'repartidor') => {
        const existingUser = users.find(u => u.id === userId);
        if (!existingUser) return;

        // **FIX:** Correctly merge new profileSetupData with existing data
        const newProfileSetupData = {
            ...existingUser.profileSetupData,
            ...data
        };
        
        const dataToSave: Partial<User> = {
            type: profileType,
            profileSetupData: newProfileSetupData,
        };

        await updateUser(userId, dataToSave);
  }, [users, updateUser]);

  const updateUserProfileImage = useCallback(async (userId: string, imageUrl: string) => {
    await updateUser(userId, { profileImage: imageUrl });
  }, [updateUser]);
      
  const actions = useMemo(() => ({
    signInWithGoogle: async () => {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } catch (error: any) {
            if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') { return; }
            console.error("Error signing in with Google: ", error);
        }
    },
    logout: async () => {
        await signOut(getAuthInstance());
        setCurrentUser(null);
        router.push('/login');
    },
    setCurrentUser,
    setIsLoadingAuth,
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
    getDistanceToProvider,
    addContact: (user: User) => {
        if (contacts.some(c => c.id === user.id)) return false;
        setContacts(prev => [...prev, user]);
        return true;
    },
    removeContact: (userId: string) => setContacts(prev => prev.filter(c => c.id !== userId)),
    isContact: (userId: string) => contacts.some(c => c.id === userId),
    getCartItemQuantity: (productId: string) => cart.find(item => item.product.id === productId)?.quantity || 0,
    updateUser,
    updateFullProfile,
    updateUserProfileImage,
    activateTransactions: async (userId: string, paymentDetails: any) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;
        const updatedData = { 
            isTransactionsActive: true,
            profileSetupData: { ...userToUpdate.profileSetupData, paymentDetails } 
        };
        await updateUser(userId, updatedData);
    },
    toggleGps: async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const newStatus = !user.isGpsActive;
        await updateUser(userId, { isGpsActive: newStatus });
    },
    addToCart(product: Product, quantity: number) {
        if(!currentUser?.id) return;
        const currentCart = transactions.find(tx => tx.status === 'Carrito Activo')?.details.items || [];
        const newCart = [...currentCart];
        const existingItemIndex = newCart.findIndex(item => item.product.id === product.id);
        if (existingItemIndex > -1) {
            newCart[existingItemIndex].quantity += quantity;
        } else {
            newCart.push({ product, quantity });
        }
        updateCart(newCart, currentUser.id, transactions);
    },
    updateCartQuantity(productId: string, quantity: number) {
        if(!currentUser?.id) return;
        let newCart = [...cart];
        const itemIndex = newCart.findIndex(item => item.product.id === productId);
        if (itemIndex > -1) {
            if (quantity > 0) {
                newCart[itemIndex].quantity = quantity;
            } else {
                newCart.splice(itemIndex, 1);
            }
        }
        updateCart(newCart, currentUser.id, transactions);
    },
    removeFromCart(productId: string) {
        if(!currentUser?.id) return;
        const newCart = cart.filter(item => item.product.id !== productId);
        updateCart(newCart, currentUser.id, transactions);
    },
    checkout: async (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
        if(!currentUser) return;
        // This is a simplified checkout. A real one would involve a payment gateway.
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
        
        // Convert 'Carrito Activo' to 'Pre-factura Pendiente'
        await updateDoc(txRef, { 
            status: 'Pre-factura Pendiente',
            'details.delivery': withDelivery,
            'details.paymentMethod': useCredicora ? 'credicora' : 'direct',
        });

        // Redirect to the payment page. In a real app, this would be the gateway.
        router.push(`/quotes/payment?commitmentId=${transactionId}`);
    },
    sendMessage: (options: any) => { 
        const user = currentUser;
        if (!user) return;
        const conversationId = [user.id, options.recipientId].sort().join('-'); 
        if (!options.createOnly) { sendMessageFlow({ conversationId, senderId: user.id, ...options }); } 
    },
    payCommitment: async (transactionId: string, paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string; }) => { 
        const user = currentUser;
        if(!user) return; 
        await TransactionFlows.payCommitment({ transactionId, userId: user.id, paymentDetails }); 
    },
    sendQuote: async (transactionId: string, quote: { breakdown: string; total: number }) => { 
        if(!currentUser) return;
        await TransactionFlows.sendQuote({ transactionId, userId: currentUser.id, breakdown: quote.breakdown, total: quote.total });
    },
    acceptQuote: async (transactionId: string) => { 
        if(!currentUser) return; 
        await TransactionFlows.acceptQuote({ transactionId, userId: currentUser.id }); 
    },
    acceptAppointment: async (transactionId: string) => { 
        if(!currentUser) return; 
        await TransactionFlows.acceptAppointment({ transactionId, userId: currentUser.id }); 
    },
    confirmPaymentReceived: async (transactionId: string, fromThirdParty: boolean) => { 
        if(!currentUser) return; 
        await TransactionFlows.confirmPaymentReceived({ transactionId, userId: currentUser.id, fromThirdParty }); 
    },
    completeWork: async (transactionId: string) => { 
        if(!currentUser) return; 
        await TransactionFlows.completeWork({ transactionId, userId: currentUser.id }); 
    },
    confirmWorkReceived: async (transactionId: string, rating: number, comment?: string) => { 
        if(!currentUser) return; 
        await TransactionFlows.confirmWorkReceived({ transactionId, userId: currentUser.id, rating, comment }); 
    },
    startDispute: async (transactionId: string) => { 
        await TransactionFlows.startDispute(transactionId); 
    },
    fetchUser: async (userId: string) => {
        if (userCache.current.has(userId)) return userCache.current.get(userId)!;
        const publicProfile = await getPublicProfileFlow({ userId });
        if (publicProfile) {
            const userData = publicProfile as User;
            userCache.current.set(userId, userData);
            return userData;
        }
        return null;
    },
    autoVerifyIdWithAI: async (user: User) => {
      if (!user.name || !user.idNumber || !user.idDocumentUrl) {
          throw new Error("Faltan datos del usuario para la verificación.");
      }
      return await autoVerifyIdWithAIFlow({
          userId: user.id,
          nameInRecord: `${user.name} ${user.lastName || ''}`,
          idInRecord: user.idNumber,
          documentImageUrl: user.idDocumentUrl,
          isCompany: user.profileSetupData?.providerType === 'company',
      });
    },
    acceptDelivery: async (transactionId: string) => {
        if (!currentUser || !currentUserLocation) return;
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) return;
        const tx = txSnap.data() as Transaction;
        const client = users.find(u => u.id === tx.clientId);
        if (!client || !client.profileSetupData?.location) return;

        const [destLat, destLon] = client.profileSetupData.location.split(',').map(Number);
        const etaResult = await getEta({
            origin: { lat: currentUserLocation.latitude, lon: currentUserLocation.longitude },
            destination: { lat: destLat, lon: destLon },
        });

        const deliveryLink = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;

        await updateDoc(txRef, { 
            status: 'En Reparto', 
            'details.deliveryProviderId': currentUser.id,
        });

        // Notify customer
        await NotificationFlows.sendNotification({
            userId: tx.clientId,
            type: 'new_publication', // Re-using for general purpose alert
            title: '¡Tu pedido está en camino!',
            message: `El repartidor ${currentUser.name} ha recogido tu pedido. Tiempo de entrega estimado: ${etaResult.durationMinutes} minutos.`,
            link: `/transactions`,
        });

        // Notify delivery person with link
         await NotificationFlows.sendNotification({
            userId: currentUser.id,
            type: 'new_publication',
            title: '¡Nuevo Servicio de Entrega!',
            message: `Dirígete a la ubicación del cliente. Haz clic para navegar.`,
            link: deliveryLink,
        });

    },
    removeGalleryImage: async (userId: string, imageId: string) => {
        const db = getFirestoreDb();
        await deleteDoc(doc(db, 'publications', imageId));
        // Note: In a real app, we'd also delete the image from storage.
        // For the UI to update, we rely on the onSnapshot listener.
    },
    validateEmail: (a:any,b:any)=>{return Promise.resolve(true)},
    sendPhoneVerification: (a:any,b:any)=>{return Promise.resolve();},
    verifyPhoneCode: (a:any,b:any)=>{return Promise.resolve(true)},
    subscribeUser: (userId: string, planName: string, amount: number) => {
        router.push(`/quotes/payment?concept=${encodeURIComponent(`Suscripción: ${planName}`)}&amount=${amount}&isSubscription=true`);
    },
    deactivateTransactions: (a:any)=>{},
    downloadTransactionsPDF: (a:any)=>{},
    sendProposalMessage: (a:any,b:any)=>{},
    acceptProposal: (a:any,b:any)=>{},
    createAppointmentRequest: (a:any)=>{},
    getAgendaEvents: (a:any) => [],
    addCommentToImage: (a:any,b:any,c:any)=>{},
    removeCommentFromImage: (a:any,b:any,c:any)=>{},
    activatePromotion: async(a:any)=>{return Promise.resolve();},
    createCampaign: async(data: Omit<CreateCampaignInput, 'userId'>) => {
        if(!currentUser) return;
        await createCampaignFlow({userId: currentUser.id, ...data});
        router.push(`/quotes/payment?concept=${encodeURIComponent(`Activación de Campaña`)}&amount=${data.budget}`);
    },
    createPublication: async(a:any)=>{return Promise.resolve();},
    createProduct: async(a:any)=>{return Promise.resolve();},
    setDeliveryAddress,
    markConversationAsRead: async(a:any)=>{return Promise.resolve();},
    toggleUserPause: (a:any,b:any)=>{},
    deleteUser: async(a:any)=>{return Promise.resolve();},
    verifyCampaignPayment: (a:any,b:any)=>{},
    verifyUserId: (a:any)=>{},
    rejectUserId: (a:any)=>{},
    getUserMetrics: (a:any,b:any)=>{return {reputation: 0, effectiveness: 0, responseTime: 'Nuevo', paymentSpeed: 'N/A'}},
    startQrSession: async (a:any) => null,
    setQrSessionAmount: async(a:any,b:any)=>{return Promise.resolve();},
    approveQrSession: async(a:any)=>{return Promise.resolve();},
    finalizeQrSession: async(a:any,b:any)=>{return Promise.resolve();},
    cancelQrSession: async(a:any,b:any)=>{return Promise.resolve();},
    registerSystemPayment: async(a:any,b:any,c:any)=>{return Promise.resolve();},
    cancelSystemTransaction: async(a:any)=>{return Promise.resolve();},
    updateUserProfileAndGallery: async(a:any,b:any)=>{return Promise.resolve();},
    requestAffiliation: async(a:any,b:any)=>{return Promise.resolve();},
    approveAffiliation: async (affiliationId: string) => {
        if(!currentUser) return;
        await approveAffiliationFlow({ affiliationId, actorId: currentUser.id });
    },
    rejectAffiliation: async (affiliationId: string) => {
        if(!currentUser) return;
        await rejectAffiliationFlow({ affiliationId, actorId: currentUser.id });
    },
    revokeAffiliation: async (affiliationId: string) => {
        if(!currentUser) return;
        await revokeAffiliationFlow({ affiliationId, actorId: currentUser.id });
    },
  }), [
    searchHistory, contacts, cart, transactions, getCartTotal, 
    getDeliveryCost, users, updateCart, router, currentUser, updateUser, updateFullProfile,
    getDistanceToProvider, currentUserLocation, toast, updateUserProfileImage, setDeliveryAddress
  ]);
  
  return (
    <CoraboStateContext.Provider value={state}>
        <CoraboActionsContext.Provider value={actions}>
            {children}
        </CoraboActionsContext.Provider>
    </CoraboStateContext.Provider>
  );
};

export const useCorabo = (): CoraboState & CoraboActions => {
  const state = useContext(CoraboStateContext);
  const actions = useContext(CoraboActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error('useCorabo must be used within a CoraboProvider');
  }
  return { ...state, ...actions };
};

export type { Transaction };
