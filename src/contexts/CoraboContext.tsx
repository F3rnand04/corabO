
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay, differenceInDays, differenceInMinutes, addDays as addDaysFns, addMonths } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { getAuth, signInWithPopup, signOut, User as FirebaseUser, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp, getFirestoreDb, getAuthInstance } from '@/lib/firebase';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, arrayUnion, getDocs, deleteDoc, collectionGroup, Unsubscribe, orderBy } from 'firebase/firestore';
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { sendMessage as sendMessageFlow, acceptProposal as acceptProposalFlow } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow, type VerificationInput } from '@/ai/flows/verification-flow';
import { getExchangeRate as getExchangeRateFlow } from '@/ai/flows/exchange-rate-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { createProduct as createProductFlow, createPublication as createPublicationFlow } from '@/ai/flows/publication-flow';
import { completeInitialSetupFlow, getPublicProfileFlow, deleteUserFlow, getProfileGallery, getProfileProducts, checkIdUniquenessFlow } from '@/ai/flows/profile-flow';
import type { GetFeedInputSchema, GetFeedOutputSchema, GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';
import { z } from 'zod';
import { haversineDistance } from '@/lib/utils';
import { getOrCreateUser, type FirebaseUserInput } from '@/ai/flows/auth-flow';
import { requestAffiliation, approveAffiliation, rejectAffiliation, revokeAffiliation } from '@/ai/flows/affiliation-flow';

// --- FEATURE FLAG ---
// Set to `true` in production to enable country-specific data updates.
const ENABLE_COUNTRY_UPDATE_LOGIC = false;


interface DailyQuote {
    requestSignature: string;
    count: number;
}

interface UserMetrics {
    reputation: number;
    effectiveness: number;
    responseTime: string; // e.g., "00-05 min", "Nuevo"
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
}

interface CoraboActions {
  signInWithGoogle: () => void;
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
  activateTransactions: (userId: string, paymentDetails: any) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: (transactions: Transaction[]) => void;
  sendMessage: (options: { recipientId: string; text?: string; createOnly?: boolean; location?: { lat: number, lon: number } }) => string;
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
  autoVerifyIdWithAI: (input: VerificationInput) => Promise<VerificationOutput>;
  getUserMetrics: (userId: string, transactions: Transaction[]) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  acceptDelivery: (transactionId: string) => void;
  getDistanceToProvider: (provider: User) => string | null;
  startQrSession: (providerId: string) => Promise<string | null>;
  setQrSessionAmount: (sessionId: string, amount: number) => Promise<void>;
  approveQrSession: (sessionId: string) => Promise<void>;
  finalizeQrSession: (sessionId: string, voucherUrl: string) => Promise<void>;
  cancelQrSession: (sessionId: string, byProvider?: boolean) => Promise<void>;
  handleUserAuth: (firebaseUser: FirebaseUser | null) => Promise<void>;
  registerSystemPayment: (concept: string, amount: number, isSubscription: boolean) => Promise<void>;
  cancelSystemTransaction: (transactionId: string) => Promise<void>;
  payCommitment: (transactionId: string, isSubscriptionPayment?: boolean) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  const [currentUserLocation, setCurrentUserLocation] = useState<GeolocationCoords | null>(null);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  
  const userCache = useRef<Map<string, User>>(new Map());
  const activeListeners = useRef<Unsubscribe[]>([]);
  
  const activeCartTx = useMemo(() => transactions.find(tx => tx.status === 'Carrito Activo'), [transactions]);
  const cart: CartItem[] = useMemo(() => activeCartTx?.details.items || [], [activeCartTx]);

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

  const cleanupListeners = useCallback(() => {
    activeListeners.current.forEach(unsubscribe => unsubscribe());
    activeListeners.current = [];
  }, []);

  const handleUserAuth = useCallback(async (firebaseUser: FirebaseUser | null) => {
    cleanupListeners();
    setQrSession(null); 
    
    if (firebaseUser) {
        try {
            const user = await getOrCreateUser(firebaseUser as FirebaseUserInput);
            
            // Critical Validation: Ensure the backend returned a valid user object.
            if (user && user.id) {
                setCurrentUser(user as User);
            } else {
                console.error("Authentication failed: Backend did not return a valid user object.", user);
                toast({
                    variant: 'destructive',
                    title: 'Error de Sincronización',
                    description: 'No se pudieron cargar los datos de tu perfil. Inténtalo de nuevo.'
                });
                await signOut(getAuthInstance());
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Error in getOrCreateUserFlow:", error);
             toast({
                variant: 'destructive',
                title: 'Error Crítico de Autenticación',
                description: 'No se pudo procesar tu inicio de sesión en el servidor.'
            });
            await signOut(getAuthInstance());
            setCurrentUser(null);
        }
    } else {
        setCurrentUser(null);
    }
    // Set loading to false only after all auth logic is complete
    setIsLoadingAuth(false);
  }, [cleanupListeners, toast]);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, handleUserAuth);
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [handleUserAuth]);

  useEffect(() => {
    if (currentUser?.id) {
      const db = getFirestoreDb();
      const listeners: Unsubscribe[] = [
        onSnapshot(doc(db, 'users', currentUser.id), (doc) => doc.exists() && setCurrentUser(doc.data() as User)),
        onSnapshot(query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id)), (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction))),
        onSnapshot(query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id), orderBy("lastUpdated", "desc")), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation))),
        onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => setQrSession(snapshot.docs.map(d => d.data() as QrSession).find(s => s.status !== 'completed' && s.status !== 'cancelled') || null)),
        onSnapshot(collection(db, 'users'), (snapshot) => setUsers(snapshot.docs.map(doc => doc.data() as User))),
        onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage))),
      ];
      activeListeners.current = listeners;
    } else {
      setTransactions([]); setConversations([]); setUsers([]); setAllPublications([]);
    }
    return () => cleanupListeners();
  }, [currentUser?.id, cleanupListeners]);

  const state = useMemo(() => ({
    currentUser, users, allPublications, transactions, conversations, cart, searchQuery,
    categoryFilter, contacts, isGpsActive, searchHistory, isLoadingAuth,
    deliveryAddress, exchangeRate, qrSession,
  }), [
    currentUser, users, allPublications, transactions, conversations, cart, searchQuery,
    categoryFilter, contacts, isGpsActive, searchHistory, isLoadingAuth,
    deliveryAddress, exchangeRate, qrSession,
  ]);
  
  const getCartTotal = useCallback(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  const getDeliveryCost = useCallback(() => ((Math.random() * 9) + 1) * 1.5, []);

  const actions = useMemo(() => {
    const updateCart = async (newCart: CartItem[]) => {
        if (!currentUser) return;
        
        const db = getFirestoreDb();
        let cartTx = transactions.find(tx => tx.status === 'Carrito Activo');
        
        if (newCart.length > 0) {
            if (cartTx) {
                const txRef = doc(db, 'transactions', cartTx.id);
                await updateDoc(txRef, { 'details.items': newCart });
            } else {
                const newTxId = `txn-cart-${currentUser.id}-${Date.now()}`;
                const providerId = newCart[0].product.providerId;
                const newCartTx: Transaction = {
                    id: newTxId, type: 'Compra', status: 'Carrito Activo', date: new Date().toISOString(), amount: 0,
                    clientId: currentUser.id, providerId: providerId, participantIds: [currentUser.id, providerId], details: { items: newCart }
                };
                await setDoc(doc(db, 'transactions', newTxId), newCartTx);
            }
        } else if (cartTx) {
            await deleteDoc(doc(db, 'transactions', cartTx.id));
        }
    };
      
    return {
      signInWithGoogle: async () => {
          const auth = getAuthInstance();
          const provider = new GoogleAuthProvider();
          try { await signInWithPopup(auth, provider); } catch (error: any) {
              if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') { return; }
              console.error("Error signing in with Google: ", error);
              toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.' });
          }
      },
      logout: async () => {
          await signOut(getAuthInstance());
          setCurrentUser(null);
          router.push('/login');
      },
      handleUserAuth,
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
      updateUser: async (userId: string, updates: Partial<User>) => {
          const db = getFirestoreDb();
          await updateDoc(doc(db, 'users', userId), updates, { merge: true });
      },
      toggleGps: async (userId: string) => {
          if (!currentUser) return;
          const newStatus = !currentUser.isGpsActive;
          await updateDoc(doc(getFirestoreDb(), 'users', userId), { isGpsActive: newStatus });
          toast({ title: `GPS ${newStatus ? 'Activado' : 'Desactivado'}` });
      },
      addToCart(product: Product, quantity: number) {
          updateCart(
              (currentCart => {
                  const existingItemIndex = currentCart.findIndex(item => item.product.id === product.id);
                  if (existingItemIndex > -1) {
                      currentCart[existingItemIndex].quantity += quantity;
                  } else {
                      currentCart.push({ product, quantity });
                  }
                  return currentCart;
              })([...cart])
          );
      },
      updateCartQuantity(productId: string, quantity: number) {
          updateCart(
              (currentCart => {
                  const itemIndex = currentCart.findIndex(item => item.product.id === productId);
                  if (itemIndex > -1) {
                      if (quantity > 0) {
                          currentCart[itemIndex].quantity = quantity;
                      } else {
                          currentCart.splice(itemIndex, 1);
                      }
                  }
                  return currentCart;
              })([...cart])
          );
      },
      removeFromCart(productId: string) {
          updateCart(cart.filter(item => item.product.id !== productId));
      },
      checkout: (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
          if(!currentUser) return;
          const db = getFirestoreDb();
          const batch = writeBatch(db);
          const originalTxRef = doc(db, 'transactions', transactionId);
          const totalAmount = getCartTotal() + (withDelivery ? getDeliveryCost() : 0);
          const updates: Partial<Transaction> = {
              status: withDelivery ? 'Buscando Repartidor' : 'Finalizado - Pendiente de Pago',
              amount: totalAmount,
              details: { ...transactions.find(t => t.id === transactionId)?.details, items: cart, delivery: withDelivery, deliveryCost: withDelivery ? getDeliveryCost() : 0, deliveryLocation: withDelivery && deliveryAddress ? { lat: 0, lon: 0, address: deliveryAddress } : undefined, paymentMethod: useCredicora ? 'credicora' : 'direct' }
          };
          if (useCredicora && currentUser.credicoraDetails) {
              const crediDetails = currentUser.credicoraDetails;
              const financedAmount = Math.min(getCartTotal() * (1 - crediDetails.initialPaymentPercentage), currentUser.credicoraLimit || 0);
              const initialPayment = getCartTotal() - financedAmount;
              updates.amount = initialPayment + (withDelivery ? getDeliveryCost() : 0);
              updates.details!.initialPayment = initialPayment;
              updates.details!.financedAmount = financedAmount;
              const installmentAmount = financedAmount > 0 ? financedAmount / crediDetails.installments : 0;
              for (let i = 1; i <= crediDetails.installments; i++) {
                  const installmentTxId = `txn-credicora-${transactionId.slice(-6)}-${i}`;
                  const dueDate = addDaysFns(new Date(), i * 15);
                  const installmentTx: Transaction = { id: installmentTxId, type: 'Sistema', status: 'Finalizado - Pendiente de Pago', date: dueDate.toISOString(), amount: installmentAmount, clientId: currentUser.id, providerId: 'corabo-admin', participantIds: [currentUser.id, 'corabo-admin'], details: { system: `Cuota ${i}/${crediDetails.installments} de Compra ${transactionId.slice(-6)}` } };
                  batch.set(doc(db, 'transactions', installmentTxId), installmentTx);
              }
              const newCredicoraLimit = (currentUser.credicoraLimit || 0) - financedAmount;
              batch.update(doc(db, 'users', currentUser.id), { credicoraLimit: newCredicoraLimit });
          }
          batch.commit().then(() => {
              toast({ title: "Pedido realizado", description: "Tu pedido ha sido enviado al proveedor." });
              router.push('/transactions');
          });
      },
      sendMessage: (options: any) => { if (!currentUser) return ''; const conversationId = [currentUser.id, options.recipientId].sort().join('-'); if (!options.createOnly) { sendMessageFlow({ conversationId, senderId: currentUser.id, ...options }); } return conversationId; },
      payCommitment: async (transactionId: string) => { if(!currentUser) return; await TransactionFlows.payCommitment({ transactionId, userId: currentUser.id }); },
      sendQuote: async (transactionId: string, quote: { breakdown: string; total: number }) => { if(!currentUser) return; await updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), { status: 'Cotización Recibida', amount: quote.total, 'details.quote': quote }); },
      acceptQuote: async (transactionId: string) => { if(!currentUser) return; await updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), { status: 'Finalizado - Pendiente de Pago' }); },
      acceptAppointment: async (transactionId: string) => { if(!currentUser) return; await TransactionFlows.acceptAppointment({ transactionId, userId: currentUser.id }); },
      confirmPaymentReceived: async (transactionId: string, fromThirdParty: boolean) => { if(!currentUser) return; await TransactionFlows.confirmPaymentReceived({ transactionId, userId: currentUser.id, fromThirdParty }); },
      completeWork: async (transactionId: string) => { if(!currentUser) return; await TransactionFlows.completeWork({ transactionId, userId: currentUser.id }); },
      confirmWorkReceived: async (transactionId: string, rating: number, comment?: string) => { if(!currentUser) return; await TransactionFlows.confirmWorkReceived({ transactionId, userId: currentUser.id, rating, comment }); },
      startDispute: async (transactionId: string) => { await TransactionFlows.startDispute(transactionId); },
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
      updateUserProfileImage: async(a:any,b:any)=>{},
      removeGalleryImage: async(a:any,b:any)=>{},
      validateEmail: async(a:any,b:any)=>{return true},
      sendPhoneVerification: async(a:any,b:any)=>{},
      verifyPhoneCode: async(a:any,b:any)=>{return true},
      updateFullProfile: async(a:any,b:any,c:any)=>{},
      subscribeUser: (a:any,b:any,c:any)=>{},
      activateTransactions: (a:any,b:any)=>{},
      deactivateTransactions: (a:any)=>{},
      downloadTransactionsPDF: (a:any)=>{},
      sendProposalMessage: (a:any,b:any)=>{},
      acceptProposal: (a:any,b:any)=>{},
      createAppointmentRequest: (a:any)=>{},
      getAgendaEvents: (a:any) => [],
      addCommentToImage: (a:any,b:any,c:any)=>{},
      removeCommentFromImage: (a:any,b:any,c:any)=>{},
      activatePromotion: async(a:any)=>{},
      createCampaign: async(a:any)=>{},
      createPublication: async(a:any)=>{},
      createProduct: async(a:any)=>{},
      setDeliveryAddress: (a:any)=>{},
      markConversationAsRead: async(a:any)=>{},
      toggleUserPause: (a:any,b:any)=>{},
      deleteUser: async(a:any)=>{},
      verifyCampaignPayment: (a:any,b:any)=>{},
      verifyUserId: (a:any)=>{},
      rejectUserId: (a:any)=>{},
      autoVerifyIdWithAI: async(a:any)=>{return {} as VerificationOutput},
      getUserMetrics: (a:any,b:any)=>{return {reputation: 0, effectiveness: 0, responseTime: 'Nuevo'}},
      acceptDelivery: (a:any)=>{},
      getDistanceToProvider: (a:any) => null,
      startQrSession: async (a:any) => null,
      setQrSessionAmount: async(a:any,b:any)=>{},
      approveQrSession: async(a:any)=>{},
      finalizeQrSession: async(a:any,b:any)=>{},
      cancelQrSession: async(a:any,b:any)=>{},
      registerSystemPayment: async(a:any,b:any,c:any)=>{},
      cancelSystemTransaction: async(a:any)=>{},
      updateUserProfileAndGallery: async(a:any,b:any)=>{},
      requestAffiliation: async(a:any,b:any)=>{},
      approveAffiliation: async(a:any)=>{},
      rejectAffiliation: async(a:any)=>{},
      revokeAffiliation: async(a:any)=>{},
    }
  }, [
      currentUser, handleUserAuth, searchHistory, toast, router, 
      transactions, cart, getCartTotal, getDeliveryCost, deliveryAddress, contacts
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

    