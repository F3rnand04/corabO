
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
    console.log('handleUserAuth: Iniciando con firebaseUser:', firebaseUser ? firebaseUser.uid : 'null');
    cleanupListeners();
    setQrSession(null); 

    
    if (firebaseUser) {
        const user = await getOrCreateUser(firebaseUser as FirebaseUserInput);
        if (user) {
          setCurrentUser(user as User);
        } else {
          await signOut(getAuthInstance());
          setCurrentUser(null);
        }
    } else {
        setCurrentUser(null);
    }
    console.log('handleUserAuth: Finalizado. currentUser:', firebaseUser ? firebaseUser.uid : 'null');
    setIsLoadingAuth(false);
  }, [cleanupListeners]);

  const logout = useCallback(async () => {
    await signOut(getAuthInstance());
    setCurrentUser(null);
    router.push('/login');
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the rest.
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return; 
      }
      console.error("Error signing in with Google: ", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.'
      });
    }
  }, [toast]);
  
  const setSearchQuery = useCallback((query: string) => {
    _setSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
    }
  }, [searchHistory]);
  
  const clearSearchHistory = useCallback(() => setSearchHistory([]), []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates, { merge: true });
  }, []);

  const toggleGps = useCallback(async (userId: string) => {
    if (!currentUser) return;
    const newStatus = !currentUser.isGpsActive;
    await updateUser(userId, { isGpsActive: newStatus });
    toast({
        title: `GPS ${newStatus ? 'Activado' : 'Desactivado'}`,
        description: 'Tu estado de ubicación ha sido actualizado.',
    });
  }, [currentUser, updateUser, toast]);
  
  const getCartTotal = useCallback(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  const getDeliveryCost = useCallback(() => ((Math.random() * 9) + 1) * 1.5, []);
  const addContact = useCallback((user: User) => {
    if (contacts.some(c => c.id === user.id)) return false;
    setContacts(prev => [...prev, user]);
    return true;
  }, [contacts]);
  const removeContact = useCallback((userId: string) => setContacts(prev => prev.filter(c => c.id !== userId)), []);
  const isContact = useCallback((userId: string) => contacts.some(c => c.id === userId), [contacts]);
  const getCartItemQuantity = useCallback((productId: string) => cart.find(item => item.product.id === productId)?.quantity || 0, [cart]);
  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
    if (userCache.current.has(userId)) return userCache.current.get(userId)!;
    const publicProfile = await getPublicProfileFlow({ userId });
    if (publicProfile) {
        const userData = publicProfile as User;
        userCache.current.set(userId, userData);
        return userData;
    }
    return null;
  }, []);

  const updateUserProfileAndGallery = useCallback(async (userId: string, image: GalleryImage) => {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    const publicationRef = doc(db, 'publications', image.id);
    batch.set(publicationRef, image);
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { promotion: null });
    await batch.commit();
  }, []);

  const activatePromotion = useCallback(async (details: { imageId: string, promotionText: string, cost: number }) => {
    if (!currentUser) return;
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', currentUser.id);
    const promotion = { text: details.promotionText, expires: addDaysFns(new Date(), 1).toISOString() };
    batch.update(userRef, { promotion });
    const txId = `txn-promo-${Date.now()}`;
    const newTransaction: Transaction = {
      id: txId, type: 'Sistema', status: 'Pago Enviado - Esperando Confirmación',
      date: new Date().toISOString(), amount: details.cost, clientId: currentUser.id, providerId: 'corabo-admin',
      participantIds: [currentUser.id, 'corabo-admin'], details: { system: `Activación de "Emprende por Hoy": ${details.promotionText}` }
    };
    batch.set(doc(db, 'transactions', txId), newTransaction);
    await batch.commit();
  }, [currentUser]);

  const updateCart = useCallback(async (newCart: CartItem[]) => {
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
                  id: newTxId,
                  type: 'Compra',
                  status: 'Carrito Activo',
                  date: new Date().toISOString(),
                  amount: 0,
                  clientId: currentUser.id,
                  providerId: providerId,
                  participantIds: [currentUser.id, providerId],
                  details: { items: newCart }
              };
              await setDoc(doc(db, 'transactions', newTxId), newCartTx);
          }
      } else if (cartTx) {
          await deleteDoc(doc(db, 'transactions', cartTx.id));
      }
  }, [currentUser, transactions]);

  const addToCart = useCallback((product: Product, quantity: number) => {
    let newCart = [...cart];
    const existingItemIndex = newCart.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
        newCart[existingItemIndex].quantity += quantity;
    } else {
        newCart.push({ product, quantity });
    }
    updateCart(newCart);
  }, [cart, updateCart]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    let newCart = [...cart];
    const itemIndex = newCart.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
        if (quantity > 0) {
            newCart[itemIndex].quantity = quantity;
        } else {
            newCart.splice(itemIndex, 1);
        }
        updateCart(newCart);
    }
  }, [cart, updateCart]);
  
  const removeFromCart = useCallback((productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    updateCart(newCart);
  }, [cart, updateCart]);
  
  const checkout = useCallback((transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
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
  }, [currentUser, getCartTotal, getDeliveryCost, transactions, cart, deliveryAddress, toast, router]);

  const sendQuote = useCallback(async (transactionId: string, quote: { breakdown: string; total: number }) => { await updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), { status: 'Cotización Recibida', amount: quote.total, 'details.quote': quote }); }, []);
  const acceptQuote = useCallback(async (transactionId: string) => { await updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), { status: 'Finalizado - Pendiente de Pago' }); }, []);
  const acceptAppointment = useCallback(async (transactionId: string) => { await TransactionFlows.acceptAppointment({ transactionId, userId: currentUser!.id }); }, [currentUser]);
  const confirmPaymentReceived = useCallback(async (transactionId: string, fromThirdParty: boolean) => { await TransactionFlows.confirmPaymentReceived({ transactionId, userId: currentUser!.id, fromThirdParty }); }, [currentUser]);
  const completeWork = useCallback(async (transactionId: string) => { await TransactionFlows.completeWork({ transactionId, userId: currentUser!.id }); }, [currentUser]);
  const confirmWorkReceived = useCallback(async (transactionId: string, rating: number, comment?: string) => { await TransactionFlows.confirmWorkReceived({ transactionId, userId: currentUser!.id, rating, comment }); }, [currentUser]);
  const startDispute = useCallback(async (transactionId: string) => { await TransactionFlows.startDispute(transactionId); }, []);

  const updateUserProfileImage = useCallback(async (userId: string, imageUrl: string) => { await updateUser(userId, { profileImage: imageUrl }); }, [updateUser]);
  const removeGalleryImage = useCallback(async (userId: string, imageId: string) => { if (!currentUser) return; await deleteDoc(doc(getFirestoreDb(), 'publications', imageId)); toast({ title: "Publicación eliminada" }); }, [currentUser, toast]);
  const validateEmail = useCallback(async (userId: string, emailToValidate: string): Promise<boolean> => { console.log(`CÓDIGO DE VERIFICACIÓN PARA ${emailToValidate}: ${Math.floor(1000 + Math.random() * 9000)}`); toast({ title: 'Código de Verificación Enviado', description: `Se ha enviado un código a tu correo. (Revisa la consola del navegador).` }); return true; }, [toast]);
  const sendPhoneVerification = useCallback(async (userId: string, phone: string) => { try { await sendSmsVerificationCodeFlow({ userId, phoneNumber: phone }); toast({ title: 'Código de Verificación Enviado', description: `Se ha enviado un código por SMS a ${phone}.` }); } catch (error) { console.error("Failed to send SMS:", error); toast({ variant: 'destructive', title: 'Error al Enviar SMS', description: 'No se pudo enviar el código de verificación.' }); } }, [toast]);
  const verifyPhoneCode = useCallback(async (userId: string, code: string): Promise<boolean> => { try { const result = await verifySmsCodeFlow({ userId, code }); if (result.success) { toast({ title: '¡Teléfono Validado!', description: result.message, className: "bg-green-100" }); } else { toast({ variant: 'destructive', title: 'Error de Verificación', description: result.message }); } return result.success; } catch (error) { console.error("Failed to verify code:", error); toast({ variant: 'destructive', title: 'Error del Servidor', description: 'No se pudo verificar el código.' }); return false; } }, [toast]);
  const updateFullProfile = useCallback(async (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider' | 'repartidor') => { if (!currentUser) return; const wasClient = currentUser.type === 'client'; await updateDoc(doc(getFirestoreDb(), 'users', userId), { type: profileType, profileSetupData: { ...data, providerType: data.providerType || (currentUser.lastName ? 'professional' : 'company') } }, { merge: true }); if (wasClient && (profileType === 'provider' || profileType === 'repartidor')) { NotificationFlows.sendWelcomeToProviderNotification({ userId }); } }, [currentUser]);
  const subscribeUser = useCallback((userId: string, planName: string, amount: number) => { if (!currentUser) return; router.push(`/quotes/payment?amount=${amount}&concept=${encodeURIComponent(`Suscripción: ${planName}`)}&isSubscription=true`); }, [currentUser, router]);
  const createCampaign = useCallback(async (data: Omit<CreateCampaignInput, 'userId'>) => { if (!currentUser) return; await createCampaignFlow({ ...data, userId: currentUser.id }); }, [currentUser]);
  const activateTransactions = useCallback(async (userId: string, paymentDetails: any) => { if (!currentUser) return; await updateDoc(doc(getFirestoreDb(), 'users', userId), { isTransactionsActive: true, profileSetupData: { ...currentUser.profileSetupData, paymentDetails } }); }, [currentUser]);
  const deactivateTransactions = useCallback((userId: string) => {}, []);
  const downloadTransactionsPDF = useCallback((transactionsToDownload: Transaction[]) => { const docPDF = new jsPDF(); (docPDF as any).autoTable(["Fecha", "ID", "Tipo", "Descripción", "Monto"], transactionsToDownload.map(tx => [new Date(tx.date).toLocaleDateString(), tx.id.slice(-6), tx.type, tx.details.serviceName || tx.details.system || tx.details.items?.map(i => i.product.name).join(', ') || 'N/A', `$${tx.amount.toFixed(2)}`]), { startY: 40 }); docPDF.save('corabo_transactions.pdf'); }, []);
  const getAgendaEvents = useCallback((transactions: Transaction[]): { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[] => { if (!currentUser || !transactions) return []; return transactions.flatMap(tx => { const events = []; if (tx.status === 'Finalizado - Pendiente de Pago' || tx.status.startsWith('Cuota')) events.push({ date: new Date(tx.date), type: 'payment' as const, description: `Pagar ${tx.details.serviceName || tx.details.system || 'Compra'}`, transactionId: tx.id }); if(tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución') events.push({ date: new Date(tx.date), type: 'task' as const, description: `Ejecutar: ${tx.details.serviceName}`, transactionId: tx.id }); return events; }); }, [currentUser]);
  const addCommentToImage = useCallback((ownerId: string, imageId: string, commentText: string) => {}, []);
  const removeCommentFromImage = useCallback((ownerId: string, imageId: string, commentIndex: number) => {}, []);
  const markConversationAsRead = useCallback(async (conversationId: string) => { if (!currentUser) return; const convoRef = doc(getFirestoreDb(), 'conversations', conversationId); const convoSnap = await getDoc(convoRef); if (convoSnap.exists()) { const updatedMessages = (convoSnap.data() as Conversation).messages.map(msg => msg.senderId !== currentUser.id ? { ...msg, isRead: true } : msg); await updateDoc(convoRef, { messages: updatedMessages }); } }, [currentUser]);
  const toggleUserPause = useCallback((userId: string, currentIsPaused: boolean) => updateUser(userId, { isPaused: !currentIsPaused }), [updateUser]);
  const deleteUser = useCallback(async (userId: string) => { await deleteUserFlow({ userId }); toast({ title: 'Usuario eliminado' }); }, [toast]);
  const verifyCampaignPayment = useCallback(async (transactionId: string, campaignId: string) => { const batch = writeBatch(getFirestoreDb()); batch.update(doc(getFirestoreDb(), "transactions", transactionId), { status: "Pagado" }); batch.update(doc(getFirestoreDb(), "campaigns", campaignId), { status: "active" }); await batch.commit(); toast({ title: "Campaña Activada" }); }, [toast]);
  const verifyUserId = useCallback((userId: string) => updateUser(userId, { idVerificationStatus: 'verified', verified: true }), [updateUser]);
  const rejectUserId = useCallback((userId: string) => updateUser(userId, { idVerificationStatus: 'rejected' }), [updateUser]);
  const getUserMetrics = useCallback((userId: string, allTransactions: Transaction[]): UserMetrics => { const providerTransactions = allTransactions.filter(tx => tx.providerId === userId); if (providerTransactions.length === 0) return { reputation: 0, effectiveness: 0, responseTime: 'Nuevo' }; const completedTransactions = providerTransactions.filter(tx => ['Pagado', 'Resuelto'].includes(tx.status)); if (completedTransactions.length === 0) return { reputation: 0, effectiveness: 0, responseTime: 'Nuevo' }; const ratedTransactions = completedTransactions.filter(tx => tx.details.clientRating && tx.details.clientRating > 0); const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0); const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 0; const effectiveness = (completedTransactions.length / providerTransactions.length) * 100; const lastTransaction = completedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]; if (!lastTransaction || !lastTransaction.details.paymentConfirmationDate) return { reputation, effectiveness, responseTime: 'Nuevo' }; const diffMinutes = differenceInMinutes(new Date(lastTransaction.details.paymentConfirmationDate), new Date(lastTransaction.date)); let responseTime = '30+ min'; if(diffMinutes < 5) responseTime = '00-05 min'; else if(diffMinutes < 15) responseTime = '05-15 min'; else if(diffMinutes < 30) responseTime = '15-30 min'; return { reputation, effectiveness, responseTime }; }, []);
  const getDistanceToProvider = useCallback((provider: User): string | null => { let userLatLon: GeolocationCoords | null = currentUserLocation; if (!userLatLon && currentUser?.profileSetupData?.location) { const [lat, lon] = currentUser.profileSetupData.location.split(',').map(Number); if (!isNaN(lat) && !isNaN(lon)) userLatLon = { latitude: lat, longitude: lon }; } if (!userLatLon || !provider.profileSetupData?.location) return null; const [providerLat, providerLon] = provider.profileSetupData.location.split(',').map(Number); if(isNaN(providerLat) || isNaN(providerLon)) return null; if (currentUser?.country !== provider.country) return null; const distance = haversineDistance(userLatLon.latitude, userLatLon.longitude, providerLat, providerLon); if (provider.profileSetupData?.showExactLocation) { if(distance < 1) return `${(distance * 1000).toFixed(0)} m`; return `${distance.toFixed(1)} km`; } else { if (distance < 1) return `~1 km`; return `~${Math.ceil(distance)} km`; } }, [currentUser?.country, currentUser?.profileSetupData.location, currentUserLocation]);
  const startQrSession = useCallback(async (providerId: string) => { if (!currentUser) return null; const sessionId = `qrsess-${Date.now()}`; await setDoc(doc(getFirestoreDb(), 'qr_sessions', sessionId), { id: sessionId, providerId, clientId: currentUser.id, status: 'pendingAmount', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), participantIds: [currentUser.id, providerId] }); return sessionId; }, [currentUser]);
  const setQrSessionAmount = useCallback(async (sessionId: string, amount: number) => { if (!currentUser || !qrSession) return; const client = await getPublicProfileFlow({ userId: qrSession.clientId }); if (!client) return; const crediDetails = credicoraLevels[(client.credicoraLevel || 1).toString()]; const financedAmount = Math.min(amount * (1 - crediDetails.initialPaymentPercentage), client.credicoraLimit || 0); await updateDoc(doc(getFirestoreDb(), 'qr_sessions', sessionId), { amount, initialPayment: amount - financedAmount, financedAmount, installments: crediDetails.installments, status: 'pendingClientApproval', updatedAt: new Date().toISOString() }); }, [currentUser, qrSession]);
  const approveQrSession = useCallback(async (sessionId: string) => { await updateDoc(doc(getFirestoreDb(), 'qr_sessions', sessionId), { status: 'pendingVoucherUpload', updatedAt: new Date().toISOString() }); }, []);
  const cancelQrSession = useCallback(async (sessionId: string) => { await updateDoc(doc(getFirestoreDb(), 'qr_sessions', sessionId), { status: 'cancelled', updatedAt: new Date().toISOString() }); }, []);
  const finalizeQrSession = useCallback(async (sessionId: string, voucherUrl: string) => { await updateDoc(doc(getFirestoreDb(), 'qr_sessions', sessionId), { voucherUrl }); await TransactionFlows.processDirectPayment({ sessionId }); toast({ title: '¡Pago Completado!', description: 'La transacción ha sido registrada.' }); }, [toast]);
  const acceptDelivery = useCallback((transactionId: string) => { if (!currentUser || currentUser.type !== 'repartidor') return; updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), { status: 'En Reparto', 'details.deliveryProviderId': currentUser.id, }); toast({ title: "¡Pedido Aceptado!" }); }, [currentUser, toast]);
  const registerSystemPayment = useCallback(async (concept: string, amount: number, isSubscription: boolean) => { if (!currentUser) return; await setDoc(doc(getFirestoreDb(), 'transactions', `systx-${Date.now()}`), { id: `systx-${Date.now()}`, type: 'Sistema', status: 'Pago Enviado - Esperando Confirmación', date: new Date().toISOString(), amount, clientId: currentUser.id, providerId: 'corabo-admin', participantIds: [currentUser.id, 'corabo-admin'], details: { system: concept, isSubscription } }); toast({ title: 'Pago registrado' }); router.push('/transactions'); }, [currentUser, toast, router]);
  const payCommitment = useCallback(async (transactionId: string, isSubscriptionPayment = false) => { const batch = writeBatch(getFirestoreDb()); const txRef = doc(getFirestoreDb(), 'transactions', transactionId); batch.update(txRef, { status: 'Pago Enviado - Esperando Confirmación' }); const txSnap = await getDoc(txRef); const txData = txSnap.data() as Transaction; if (isSubscriptionPayment && txData.details.isSubscription && currentUser) { const userRef = doc(getFirestoreDb(), 'users', currentUser.id); batch.update(userRef, { isSubscribed: true }); const renewalDate = addMonths(new Date(), 1); const renewalTxId = `systx-renew-${currentUser.id}-${renewalDate.getTime()}`; batch.set(doc(getFirestoreDb(), 'transactions', renewalTxId), { id: renewalTxId, type: 'Sistema', status: 'Finalizado - Pendiente de Pago', date: renewalDate.toISOString(), amount: txData.amount, clientId: currentUser.id, providerId: 'corabo-admin', participantIds: [currentUser.id, 'corabo-admin'], details: { system: `Renovación: ${txData.details.system}`, isRenewable: true } }); } await batch.commit(); toast({ title: isSubscriptionPayment ? 'Suscripción Activada' : 'Pago registrado' }); }, [currentUser, toast]);
  const cancelSystemTransaction = useCallback(async (transactionId: string) => { await deleteDoc(doc(getFirestoreDb(), 'transactions', transactionId)); toast({ title: "Compromiso cancelado" }); }, [toast]);
  const sendProposalMessage = useCallback(async (conversationId: string, proposal: AgreementProposal) => { if (!currentUser) return; const conversationDoc = await getDoc(doc(getFirestoreDb(), 'conversations', conversationId)); if (!conversationDoc.exists()) throw new Error("Conversation not found"); const recipient = conversationDoc.data()?.participantIds.find((p: string) => p !== currentUser.id); if (!recipient) throw new Error("Recipient not found"); await sendMessageFlow({ conversationId, senderId: currentUser.id, proposal, recipientId: recipient }); toast({ title: 'Propuesta enviada' }); }, [currentUser, toast]);
  const sendMessage = useCallback((options: { recipientId: string; text?: string; createOnly?: boolean; location?: { lat: number, lon: number } }): string => { if (!currentUser) return ''; const conversationId = [currentUser.id, options.recipientId].sort().join('-'); if (!options.createOnly) { const payload: any = { conversationId, senderId: currentUser.id, recipientId: options.recipientId }; if (options.text) payload.text = options.text; if (options.location) payload.location = options.location; sendMessageFlow(payload); } return conversationId; }, [currentUser]);
  const createPublication = useCallback(async (data: CreatePublicationInput) => { if (!currentUser) return; await createPublicationFlow({ ...data, userId: currentUser.id }); }, [currentUser]);
  const createProduct = useCallback(async (data: CreateProductInput) => { if (!currentUser) return; await createProductFlow({ ...data, userId: currentUser.id }); }, [currentUser]);

  useEffect(() => {
    console.log('useEffect [currentUser?.id]: Activado. currentUser?.id:', currentUser?.id);
    cleanupListeners();
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
      console.log(`useEffect [currentUser?.id]: Listeners set up for user ${currentUser.id}`);
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

  const actions = useMemo(() => ({
    signInWithGoogle, setSearchQuery, setCategoryFilter, clearSearchHistory, logout, addToCart,
    updateCartQuantity, removeFromCart, getCartTotal, getDeliveryCost, checkout, 
    payCommitment, addContact, isContact, removeContact, toggleGps, updateUser, updateUserProfileImage, removeGalleryImage,
    validateEmail, sendPhoneVerification, verifyPhoneCode, updateFullProfile, subscribeUser, activateTransactions,
    deactivateTransactions, downloadTransactionsPDF, sendMessage, sendProposalMessage, acceptProposal: acceptProposalFlow,
    createAppointmentRequest: TransactionFlows.createAppointmentRequest, getAgendaEvents, addCommentToImage,
    removeCommentFromImage, getCartItemQuantity, activatePromotion, createCampaign, createPublication,
    createProduct, setDeliveryAddress, markConversationAsRead, toggleUserPause, deleteUser, verifyCampaignPayment,
    verifyUserId, rejectUserId, autoVerifyIdWithAI: autoVerifyIdWithAIFlow, getUserMetrics, fetchUser, acceptDelivery,
    getDistanceToProvider, startQrSession, setQrSessionAmount, approveQrSession, finalizeQrSession, cancelQrSession,
    handleUserAuth, registerSystemPayment, cancelSystemTransaction, updateUserProfileAndGallery,
  }), [
    signInWithGoogle, setSearchQuery, setCategoryFilter, clearSearchHistory, logout, addToCart,
    updateCartQuantity, removeFromCart, getCartTotal, getDeliveryCost, checkout, 
    payCommitment, addContact, isContact, removeContact, toggleGps, updateUser, updateUserProfileImage, removeGalleryImage,
    validateEmail, sendPhoneVerification, verifyPhoneCode, updateFullProfile, subscribeUser, activateTransactions,
    deactivateTransactions, downloadTransactionsPDF, sendMessage, sendProposalMessage, getAgendaEvents, addCommentToImage,
    removeCommentFromImage, getCartItemQuantity, activatePromotion, createCampaign, createPublication,
    createProduct, setDeliveryAddress, markConversationAsRead, toggleUserPause, deleteUser, verifyCampaignPayment,
    verifyUserId, rejectUserId, getUserMetrics, fetchUser, acceptDelivery, getDistanceToProvider,
    startQrSession, setQrSessionAmount, approveQrSession, finalizeQrSession, cancelQrSession, handleUserAuth,
    registerSystemPayment, cancelSystemTransaction, updateUserProfileAndGallery,
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

    
