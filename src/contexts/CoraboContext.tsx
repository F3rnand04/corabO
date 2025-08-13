

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner, CreatePublicationInput, CreateProductInput, QrSession } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay, differenceInDays, differenceInHours, differenceInMinutes, addDays as addDaysFns } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirebaseApp, getFirestoreDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, arrayUnion, getDocs, deleteDoc, collectionGroup, Unsubscribe, orderBy } from 'firebase/firestore';
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { acceptProposal as acceptProposalFlow, sendMessage as sendMessageFlow } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow, type VerificationInput } from '@/ai/flows/verification-flow';
import { getExchangeRate } from '@/ai/flows/exchange-rate-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { createProduct as createProductFlow, createPublication as createPublicationFlow } from '@/ai/flows/publication-flow';
import type { GetFeedInputSchema, GetFeedOutputSchema, GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';
import { z } from 'zod';
import { haversineDistance } from '@/lib/utils';

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
  requestService: (service: Service) => void;
  requestQuoteFromGroup: (serviceName: string, items: string[], groupOrProvider: string) => boolean;
  sendQuote: (transactionId: string, quote: { breakdown: string; total: number }) => void;
  acceptQuote: (transactionId: string) => void;
  acceptAppointment: (transactionId: string) => void;
  payCommitment: (transactionId: string, rating?: number, comment?: string) => void;
  confirmPaymentReceived: (transactionId: string, fromThirdParty: boolean) => void;
  completeWork: (transactionId: string) => void;
  confirmWorkReceived: (transactionId: string, rating: number, comment?: string) => void;
  startDispute: (transactionId: string) => void;
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
  completeInitialSetup: (userId: string, data: { lastName: string; idNumber: string; birthDate: string }) => Promise<void>;
  subscribeUser: (userId: string, planName: string, amount: number) => void;
  activateTransactions: (userId: string, paymentDetails: any) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: (transactions: Transaction[]) => void;
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => string;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: Omit<AppointmentRequest, 'clientId'>) => void;
  getAgendaEvents: (transactions: Transaction[]) => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => void;
  createCampaign: (data: Omit<CreateCampaignInput, 'userId'>) => Promise<void>;
  createPublication: (data: CreatePublicationInput) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  setDeliveryAddress: (address: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  toggleUserPause: (userId: string, currentIsPaused: boolean) => void;
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
  cancelQrSession: (sessionId: string) => Promise<void>;
  handleUserAuth: (firebaseUser: FirebaseUser | null) => Promise<void>;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

// Moved this function outside the provider to keep its reference stable
const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data() as User;
    } else {
      const nameParts = (firebaseUser.displayName || 'Usuario Nuevo').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const coraboId = (firstName.substring(0, 3)).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newUser: User = {
        id: firebaseUser.uid,
        coraboId: coraboId,
        name: firstName,
        lastName: lastName,
        idNumber: '',
        birthDate: '',
        createdAt: new Date().toISOString(),
        type: 'client',
        reputation: 0,
        effectiveness: 100,
        profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        email: firebaseUser.email || '',
        phone: '',
        emailValidated: firebaseUser.emailVerified,
        phoneValidated: false,
        isGpsActive: true,
        isInitialSetupComplete: false,
        credicoraLevel: 1,
        credicoraLimit: 150,
        profileSetupData: {
            location: "10.4806,-66.9036"
        },
        isSubscribed: false,
        isTransactionsActive: false,
        idVerificationStatus: 'rejected',
      };
      
      await setDoc(userDocRef, newUser);
      return newUser;
    }
}


export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const activeCartTx = transactions.find(tx => tx.status === 'Carrito Activo');
  const cart: CartItem[] = activeCartTx?.details.items || [];
  
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
  const listeners = useRef<Map<string, Unsubscribe>>(new Map());

  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
    if (userCache.current.has(userId)) {
        return userCache.current.get(userId)!;
    }
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        userCache.current.set(userId, userData);
        return userData;
    }
    return null;
  }, []);

   const handleUserAuth = useCallback(async (firebaseUser: FirebaseUser | null) => {
    // Cleanup previous listeners to prevent memory leaks on user switch
    listeners.current.forEach(unsubscribe => unsubscribe());
    listeners.current.clear();
    setQrSession(null); 

    if (firebaseUser) {
        const userData = await getOrCreateUser(firebaseUser);
        userCache.current.set(userData.id, userData);
        setCurrentUser(userData);

        const db = getFirestoreDb();
        
        // Setup all listeners now that we are authenticated
        const userListener = onSnapshot(doc(db, 'users', userData.id), (doc) => {
            if (doc.exists()) setCurrentUser(doc.data() as User);
        });
        listeners.current.set('currentUser', userListener);
        
        const publicationsListener = onSnapshot(query(collection(db, 'publications'), orderBy('createdAt', 'desc')), (snapshot) => {
            setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
        });
        listeners.current.set('publications', publicationsListener);
        
        const transactionsListener = onSnapshot(query(collection(db, "transactions"), where("participantIds", "array-contains", userData.id)), (snapshot) => {
            setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
        });
        listeners.current.set('transactions', transactionsListener);
        
        const conversationsListener = onSnapshot(query(collection(db, "conversations"), where("participantIds", "array-contains", userData.id)), (snapshot) => {
            const convos = snapshot.docs.map(doc => doc.data() as Conversation);
            // Sort client-side
            convos.sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            setConversations(convos);
        });
        listeners.current.set('conversations', conversationsListener);

        const qrSessionsListener = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', userData.id)), (snapshot) => {
            const sessions = snapshot.docs.map(d => d.data() as QrSession);
            setQrSession(sessions.find(s => s.status !== 'completed' && s.status !== 'cancelled') || null);
        });
        listeners.current.set('qrSessions', qrSessionsListener);

    } else {
        setCurrentUser(null);
        setAllPublications([]);
        setTransactions([]);
        setConversations([]);
    }
    setIsLoadingAuth(false);
  }, []);


  useEffect(() => {
    const db = getFirestoreDb();
    // This listener is for the UserSwitcher, it should run even without a logged-in user.
    // The security rules have been updated to allow this specific read.
    const allUsersListener = onSnapshot(collection(db, 'users'), (snapshot) => {
        const allUsers = snapshot.docs.map(doc => doc.data() as User);
        setUsers(allUsers);
    });
    return () => allUsersListener();
  }, []);


  useEffect(() => {
    if (currentUser?.isGpsActive) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting geolocation: ", error);
        }
      );
    } else {
      setCurrentUserLocation(null);
    }
  }, [currentUser?.isGpsActive]);


  const signInWithGoogle = async () => {
    const auth = getAuth(getFirebaseApp());
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.'
      });
    }
  };

  const logout = async () => {
    try {
        await signOut(getAuth(getFirebaseApp()));
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  const setSearchQuery = (query: string) => {
    _setSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
    }
  }
  
  const clearSearchHistory = () => {
    setSearchHistory([]);
  }

  const addToCart = async (product: Product, quantity: number) => {
    if (!currentUser) return;
    if (!currentUser.isTransactionsActive) {
      toast({ variant: "destructive", title: "Acción Requerida", description: "Debes activar tu registro de transacciones para poder comprar." });
      return;
    }
  
    const provider = await fetchUser(product.providerId);
    if (!provider?.isTransactionsActive) {
      toast({ variant: "destructive", title: "Proveedor no disponible", description: "Este proveedor no tiene las transacciones activas en este momento." });
      return;
    }
  
    const db = getFirestoreDb();
    const activeCartTx = transactions.find(tx => tx.status === 'Carrito Activo' && tx.clientId === currentUser.id);
  
    if (activeCartTx && activeCartTx.providerId !== product.providerId) {
      toast({ variant: "destructive", title: "Carrito Multi-tienda", description: "No puedes añadir productos de diferentes tiendas. Finaliza esta compra primero." });
      return;
    }
  
    if (activeCartTx) {
      const existingItemIndex = activeCartTx.details.items?.findIndex(item => item.product.id === product.id) ?? -1;
      const newItems = [...(activeCartTx.details.items || [])];
      
      if (existingItemIndex > -1) {
        newItems[existingItemIndex].quantity += quantity;
      } else {
        newItems.push({ product, quantity });
      }
      await updateDoc(doc(db, 'transactions', activeCartTx.id), { 'details.items': newItems });
    } else {
      const newTx: Transaction = {
        id: `cart-${currentUser.id}-${Date.now()}`,
        type: 'Compra',
        status: 'Carrito Activo',
        date: new Date().toISOString(),
        amount: 0,
        clientId: currentUser.id,
        providerId: product.providerId,
        participantIds: [currentUser.id, product.providerId],
        details: { items: [{ product, quantity }] }
      };
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
    }
    toast({ title: "Producto añadido", description: `${product.name} fue añadido a tu carrito.` });
  };
  
  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!currentUser || !currentUser.isTransactionsActive) return;
  
    const db = getFirestoreDb();
    const activeCartTx = transactions.find(tx => tx.status === 'Carrito Activo' && tx.clientId === currentUser.id);
  
    if (!activeCartTx) return;
  
    const updatedItems = (activeCartTx.details.items || [])
      .map(item => item.product.id === productId ? { ...item, quantity } : item)
      .filter(item => item.quantity > 0);
  
    if (updatedItems.length === 0) {
      await deleteDoc(doc(db, 'transactions', activeCartTx.id));
    } else {
      await updateDoc(doc(db, 'transactions', activeCartTx.id), { 'details.items': updatedItems });
    }
  };

  const removeFromCart = (productId: string) => {
    updateCartQuantity(productId, 0);
  };
  
  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  
  const getDeliveryCost = () => {
    const distanceInKm = (Math.random() * 9) + 1;
    return distanceInKm * 1.5;
  };
  
  const addContact = (user: User) => {
    if (contacts.some(c => c.id === user.id)) return false;
    setContacts(prev => [...prev, user]);
    return true;
  };

  const removeContact = (userId: string) => {
    setContacts(prev => prev.filter(c => c.id !== userId));
  };
  
  const isContact = (userId: string) => {
    return contacts.some(c => c.id !== userId);
  };
  
  const updateUser = async (userId: string, updates: Partial<User>) => {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
  };

  const completeInitialSetup = async (userId: string, data: { lastName: string; idNumber: string; birthDate: string }) => {
    const updates = {
        ...data,
        isInitialSetupComplete: true,
    };
    await updateUser(userId, updates);
  };
  
  const toggleGps = (userId: string) => {
    if (!currentUser) return;
    const newGpsState = !currentUser.isGpsActive;
    updateUser(userId, { isGpsActive: newGpsState });
    toast({
      title: `GPS ${newGpsState ? 'Habilitado' : 'Deshabilitado'}`,
      description: newGpsState ? 'Tu ubicación ahora es visible para otros.' : 'Ya no estás compartiendo tu ubicación.',
    });
  };

  const getDistanceToProvider = (provider: User): string | null => {
    let userLatLon: GeolocationCoords | null = currentUserLocation;
    
    // Fallback to profile location if live location is not available
    if (!userLatLon && currentUser?.profileSetupData?.location) {
        const [lat, lon] = currentUser.profileSetupData.location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
            userLatLon = { latitude: lat, longitude: lon };
        }
    }
    
    if (!userLatLon || !provider.profileSetupData?.location) return null;
    
    const [providerLat, providerLon] = provider.profileSetupData.location.split(',').map(Number);
    if(isNaN(providerLat) || isNaN(providerLon)) return null;

    const distance = haversineDistance(
      userLatLon.latitude,
      userLatLon.longitude,
      providerLat,
      providerLon
    );

    if (provider.profileSetupData?.showExactLocation) {
      if(distance < 1) return `${(distance * 1000).toFixed(0)} m`;
      return `${distance.toFixed(1)} km`;
    } else {
        if (distance < 1) return `~1 km`;
        return `~${Math.ceil(distance)} km`;
    }
  };

  const sendMessage = (recipientId: string, text: string, createOnly: boolean = false): string => {
    if (!currentUser) return '';
    const db = getFirestoreDb();
    const convoId = [currentUser.id, recipientId].sort().join('_');
    
    if (createOnly) {
      const convoRef = doc(db, 'conversations', convoId);
      getDoc(convoRef).then(snap => {
        if (!snap.exists()) {
          setDoc(convoRef, {
            id: convoId,
            participantIds: [currentUser.id, recipientId].sort(),
            messages: [],
            lastUpdated: new Date().toISOString(),
          });
        }
      });
    } else {
        sendMessageFlow({
            conversationId: convoId,
            senderId: currentUser.id,
            text: text,
            recipientId: recipientId
        }).catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: "Error al enviar mensaje" });
        });
    }
    return convoId;
  };

  const sendProposalMessage = async (conversationId: string, proposal: AgreementProposal) => {
    if (!currentUser) return;
    try {
        const conversationDoc = await getDoc(doc(getFirestoreDb(), 'conversations', conversationId));
        if (!conversationDoc.exists()) throw new Error("Conversation not found");

        const recipient = conversationDoc.data()?.participantIds.find((p: string) => p !== currentUser.id);
        if (!recipient) throw new Error("Recipient not found");
        
        await sendMessageFlow({
            conversationId: conversationId,
            senderId: currentUser.id,
            proposal: proposal,
            recipientId: recipient,
        });
        toast({ title: 'Propuesta enviada' });
    } catch (error) {
        console.error("Error enviando propuesta:", error);
        toast({ variant: 'destructive', title: 'Error al enviar la propuesta' });
    }
  };

  const acceptProposal = async (conversationId: string, messageId: string) => {
    if (!currentUser) return;
    try {
      await acceptProposalFlow({ conversationId, messageId, acceptorId: currentUser.id });
      toast({ title: '¡Acuerdo Aceptado!', description: 'Se ha creado un nuevo compromiso de pago.' });
    } catch (error) {
      console.error("Error aceptando propuesta:", error);
      toast({ variant: 'destructive', title: 'Error al aceptar la propuesta' });
    }
  };
  
  const markConversationAsRead = async (conversationId: string) => {
    if (!currentUser) return;
    const db = getFirestoreDb();
    const convoRef = doc(db, 'conversations', conversationId);
    const convoSnap = await getDoc(convoRef);

    if (convoSnap.exists()) {
      const conversation = convoSnap.data() as Conversation;
      const unreadMessages = conversation.messages.some(m => !m.isRead && m.senderId !== currentUser.id);

      if (unreadMessages) {
        const updatedMessages = conversation.messages.map(msg => 
          msg.senderId !== currentUser.id ? { ...msg, isRead: true } : msg
        );
        await updateDoc(convoRef, { messages: updatedMessages });
      }
    }
  };

  const sendQuote = (transactionId: string, quote: { breakdown: string; total: number }) => {
    if (!currentUser) return;
    TransactionFlows.sendQuote({ transactionId, userId: currentUser.id, breakdown: quote.breakdown, total: quote.total });
  };
  const acceptQuote = (transactionId: string) => {
    if (!currentUser) return;
    TransactionFlows.acceptQuote({ transactionId, userId: currentUser.id });
  };
  const acceptAppointment = (transactionId: string) => {
      if (!currentUser) return;
      TransactionFlows.acceptAppointment({ transactionId, userId: currentUser.id });
  };
  const payCommitment = (transactionId: string, rating?: number, comment?: string) => {
    if (!currentUser) return;
    TransactionFlows.payCommitment({ transactionId, userId: currentUser.id, rating, comment });
  };
  const confirmPaymentReceived = (transactionId: string, fromThirdParty: boolean) => {
    if (!currentUser) return;
    TransactionFlows.confirmPaymentReceived({ transactionId, userId: currentUser.id, fromThirdParty });
  };
  const completeWork = (transactionId: string) => {
    if (!currentUser) return;
    TransactionFlows.completeWork({ transactionId, userId: currentUser.id });
  };
  const confirmWorkReceived = (transactionId: string, rating: number, comment?: string) => {
    if (!currentUser) return;
    TransactionFlows.confirmWorkReceived({ transactionId, userId: currentUser.id, rating, comment });
  };
  const startDispute = (transactionId: string) => {
    TransactionFlows.startDispute(transactionId);
  };
  const createAppointmentRequest = (request: Omit<AppointmentRequest, 'clientId'>) => {
    if (!currentUser) return;
    TransactionFlows.createAppointmentRequest({ ...request, clientId: currentUser.id });
  };

  const toggleUserPause = (userId: string, currentIsPaused: boolean) => {
    updateUser(userId, { isPaused: !currentIsPaused });
  };
  const verifyCampaignPayment = async (transactionId: string, campaignId: string) => {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    const txRef = doc(db, "transactions", transactionId);
    batch.update(txRef, { status: "Pagado" });
    const campaignRef = doc(db, "campaigns", campaignId);
    batch.update(campaignRef, { status: "active" });
    await batch.commit();
    toast({ title: "Campaña Activada" });
  };
  const verifyUserId = (userId: string) => updateUser(userId, { idVerificationStatus: 'verified', verified: true });
  const rejectUserId = (userId: string) => updateUser(userId, { idVerificationStatus: 'rejected' });
  const autoVerifyIdWithAI = async (input: VerificationInput): Promise<VerificationOutput> => {
    if(currentUser){
      await updateUser(currentUser.id, { idVerificationStatus: 'pending', idDocumentUrl: input.documentImageUrl });
    }
    const result = await autoVerifyIdWithAIFlow(input);
    if(currentUser){
       await updateUser(currentUser.id, { idVerificationStatus: result.nameMatch && result.idMatch ? 'verified' : 'rejected' });
    }
    return result;
  };

  const createCampaign = (data: Omit<CreateCampaignInput, 'userId'>) => {
    if (!currentUser) return Promise.reject("User not authenticated");
    return createCampaignFlow({ ...data, userId: currentUser.id });
  };

  const createPublication = async (data: CreatePublicationInput) => {
    if (!currentUser) throw new Error("User not authenticated");
    await createPublicationFlow(data);
  };
  
  const createProduct = async (data: CreateProductInput) => {
    if (!currentUser) throw new Error("User not authenticated");
    await createProductFlow(data);
  };

  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
      if(!currentUser) return;
      const db = getFirestoreDb();
      const batch = writeBatch(db);

      const originalTxRef = doc(db, 'transactions', transactionId);
      
      const totalAmount = getCartTotal() + (withDelivery ? getDeliveryCost() : 0);
      
      const updates: Partial<Transaction> = {
          status: withDelivery ? 'Buscando Repartidor' : 'Finalizado - Pendiente de Pago',
          amount: totalAmount,
          details: {
              ...transactions.find(t => t.id === transactionId)?.details,
              items: cart,
              delivery: withDelivery,
              deliveryCost: withDelivery ? getDeliveryCost() : 0,
              deliveryLocation: withDelivery && deliveryAddress ? { lat: 0, lon: 0, address: deliveryAddress } : undefined,
              paymentMethod: useCredicora ? 'credicora' : 'direct',
          }
      };

      if (useCredicora && currentUser.credicoraDetails) {
          const crediDetails = currentUser.credicoraDetails;
          const financedAmount = Math.min(
              getCartTotal() * (1 - crediDetails.initialPaymentPercentage), 
              currentUser.credicoraLimit || 0
          );
          const initialPayment = getCartTotal() - financedAmount;

          updates.amount = initialPayment + (withDelivery ? getDeliveryCost() : 0);
          updates.details!.initialPayment = initialPayment;
          updates.details!.financedAmount = financedAmount;

          const installmentAmount = financedAmount / crediDetails.installments;
          for (let i = 1; i <= crediDetails.installments; i++) {
              const installmentTxId = `txn-credicora-${transactionId.slice(-6)}-${i}`;
              const dueDate = addDaysFns(new Date(), i * 15);
              const installmentTx: Transaction = {
                  id: installmentTxId,
                  type: 'Sistema',
                  status: 'Finalizado - Pendiente de Pago',
                  date: dueDate.toISOString(),
                  amount: installmentAmount,
                  clientId: currentUser.id,
                  providerId: 'corabo-admin',
                  participantIds: [currentUser.id, 'corabo-admin'],
                  details: {
                      system: `Cuota ${i}/${crediDetails.installments} de Compra ${transactionId.slice(-6)}`,
                  },
              };
              batch.set(doc(db, 'transactions', installmentTxId), installmentTx);
          }
          const newCredicoraLimit = (currentUser.credicoraLimit || 0) - financedAmount;
          batch.update(doc(db, 'users', currentUser.id), { credicoraLimit: newCredicoraLimit });
      }

      batch.commit().then(() => {
          toast({ title: "Pedido realizado", description: "Tu pedido ha sido enviado al proveedor." });
          router.push('/transactions');
      });
  };

  const acceptDelivery = (transactionId: string) => {
    if (!currentUser || currentUser.type !== 'repartidor') return;
    const db = getFirestoreDb();
    const txRef = doc(db, 'transactions', transactionId);
    updateDoc(txRef, {
        status: 'En Reparto',
        'details.deliveryProviderId': currentUser.id,
    });
    toast({ title: "¡Pedido Aceptado!", description: "El proveedor ha sido notificado. ¡A entregar!" });
  };

  const requestService = (service: Service) => {};
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => { return true; };
  
  const updateUserProfileImage = async (userId: string, imageUrl: string) => {
     await updateUser(userId, { profileImage: imageUrl });
  };
  
  const removeGalleryImage = async (userId: string, imageId: string) => {
    if (!currentUser) return;
    // This now correctly deletes from the backend collection directly.
    const db = getFirestoreDb();
    await deleteDoc(doc(db, 'publications', imageId));
    toast({ title: "Publicación eliminada" });
  };
  
  const validateEmail = async (userId: string, emailToValidate: string): Promise<boolean> => {
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`CÓDIGO DE VERIFICACIÓN PARA ${emailToValidate}: ${verificationCode}`);
    toast({
        title: 'Código de Verificación Enviado',
        description: `Se ha enviado un código a tu correo. (Revisa la consola del navegador para ver el código).`
    });
    return true;
  };
  
  const sendPhoneVerification = async (userId: string, phone: string) => {
    try {
        await sendSmsVerificationCodeFlow({ userId, phoneNumber: phone });
        toast({
            title: 'Código de Verificación Enviado',
            description: `Se ha enviado un código por SMS a ${phone}.`
        });
    } catch (error) {
        console.error("Failed to send SMS:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Enviar SMS',
            description: 'No se pudo enviar el código de verificación. Intenta más tarde.'
        });
    }
  };

  const verifyPhoneCode = async (userId: string, code: string): Promise<boolean> => {
    try {
        const result = await verifySmsCodeFlow({ userId, code });
        if (result.success) {
            toast({
                title: '¡Teléfono Validado!',
                description: result.message,
                className: "bg-green-100 border-green-300 text-green-800",
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error de Verificación',
                description: result.message,
            });
        }
        return result.success;
    } catch (error) {
        console.error("Failed to verify code:", error);
        toast({
            variant: 'destructive',
            title: 'Error del Servidor',
            description: 'No se pudo verificar el código. Intenta más tarde.'
        });
        return false;
    }
  };

  const updateFullProfile = async (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider' | 'repartidor') => {
    if (!currentUser) return;
    
    const wasClient = currentUser.type === 'client';
    const isNowProviderOrRepartidor = profileType === 'provider' || profileType === 'repartidor';
    
    const updates: Partial<User> = {
        profileSetupData: data,
        type: profileType,
    };
    
    await updateUser(userId, updates);
    
    if (wasClient && isNowProviderOrRepartidor) {
      NotificationFlows.sendWelcomeToProviderNotification({ userId });
    }
  };

  const subscribeUser = (userId: string, planName: string, amount: number) => {
      const txId = `txn-sub-${Date.now()}`;
      const db = getFirestoreDb();
      const subscriptionTransaction: Transaction = {
          id: txId,
          type: 'Sistema',
          status: 'Finalizado - Pendiente de Pago',
          date: new Date().toISOString(),
          amount: amount,
          clientId: userId,
          providerId: 'corabo-admin',
          participantIds: [userId, 'corabo-admin'],
          details: {
              system: `Pago de suscripción: ${planName}`,
          },
      };
      const txRef = doc(db, 'transactions', txId);
      setDoc(txRef, subscriptionTransaction);
      router.push(`/quotes/payment?commitmentId=${txId}&amount=${amount}`);
  };
  
  const activateTransactions = async (userId: string, paymentDetails: any) => {
      if (!currentUser) return;
      const db = getFirestoreDb();
      const userRef = doc(db, 'users', userId);
      
      const updates = {
          isTransactionsActive: true,
          profileSetupData: {
              ...currentUser.profileSetupData,
              paymentDetails: paymentDetails,
          },
      };

      await updateDoc(userRef, updates);
  };
  
  const deactivateTransactions = (userId: string) => {};
  const downloadTransactionsPDF = (transactions: Transaction[]) => {};
  
  const getAgendaEvents = (transactions: Transaction[]): { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[] => {
    const events: { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[] = [];
    if (!currentUser || !transactions) return events;

    transactions.forEach(tx => {
        if (tx.status === 'Finalizado - Pendiente de Pago' || tx.status.startsWith('Cuota')) {
            events.push({
                date: new Date(tx.date),
                type: 'payment',
                description: `Pagar ${tx.details.serviceName || tx.details.system || 'Compra'}`,
                transactionId: tx.id,
            });
        }
        if(tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución') {
             events.push({
                date: new Date(tx.date),
                type: 'task',
                description: `Ejecutar: ${tx.details.serviceName}`,
                transactionId: tx.id,
            });
        }
    });

    return events;
  };
  const addCommentToImage = (ownerId: string, imageId: string, commentText: string) => {};
  const removeCommentFromImage = (ownerId: string, imageId: string, commentIndex: number) => {};
  const activatePromotion = (details: { imageId: string, promotionText: string, cost: number }) => {};
  
  const getUserMetrics = (userId: string, transactions: Transaction[]): UserMetrics => {
    const completedTransactions = transactions.filter(
      (tx) => tx.providerId === userId && (tx.status === 'Pagado' || tx.status === 'Resuelto')
    );
    if (completedTransactions.length === 0) {
      return { reputation: 0, effectiveness: 0, responseTime: 'Nuevo' };
    }

    const totalRating = completedTransactions.reduce(
      (acc, tx) => acc + (tx.details.clientRating || 0),
      0
    );
    const reputation = totalRating / completedTransactions.filter(tx => tx.details.clientRating).length || 0;

    const effectiveness =
      (completedTransactions.length / transactions.filter((tx) => tx.providerId === userId).length) * 100;
    
    const lastTransaction = completedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!lastTransaction) return { reputation, effectiveness, responseTime: 'Nuevo' };
    
    const requestDate = new Date(lastTransaction.date);
    const completionDate = new Date(lastTransaction.details.paymentConfirmationDate || new Date());
    
    const diffMinutes = differenceInMinutes(completionDate, requestDate);
    let responseTime = '30+ min';
    if(diffMinutes < 5) responseTime = '00-05 min';
    else if(diffMinutes < 15) responseTime = '05-15 min';
    else if(diffMinutes < 30) responseTime = '15-30 min';

    return { reputation, effectiveness, responseTime };
  };

  const startQrSession = async (providerId: string) => {
    if (!currentUser) return null;
    const db = getFirestoreDb();
    const sessionId = `qrsess-${Date.now()}`;
    const sessionRef = doc(db, 'qr_sessions', sessionId);
    const newSession: QrSession = {
        id: sessionId,
        providerId: providerId,
        clientId: currentUser.id,
        status: 'pendingAmount',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participantIds: [currentUser.id, providerId],
    };
    await setDoc(sessionRef, newSession);
    return sessionId;
  };

  const setQrSessionAmount = async (sessionId: string, amount: number) => {
    if (!currentUser || !qrSession) return;
    const db = getFirestoreDb();
    const sessionRef = doc(db, 'qr_sessions', sessionId);
    const client = await fetchUser(qrSession.clientId);
    if (!client) return;

    const crediDetails = credicoraLevels[(client.credicoraLevel || 1).toString()];
    const financedAmount = Math.min(
        amount * (1 - crediDetails.initialPaymentPercentage), 
        client.credicoraLimit || 0
    );
    const initialPayment = amount - financedAmount;

    await updateDoc(sessionRef, { 
        amount, 
        initialPayment,
        financedAmount,
        installments: crediDetails.installments,
        status: 'pendingClientApproval',
        updatedAt: new Date().toISOString(),
    });
  };

  const approveQrSession = async (sessionId: string) => {
    const db = getFirestoreDb();
    const sessionRef = doc(db, 'qr_sessions', sessionId);
    await updateDoc(sessionRef, { status: 'pendingVoucherUpload', updatedAt: new Date().toISOString() });
  };
  
  const cancelQrSession = async (sessionId: string) => {
      const db = getFirestoreDb();
      const sessionRef = doc(db, 'qr_sessions', sessionId);
      await updateDoc(sessionRef, { status: 'cancelled', updatedAt: new Date().toISOString() });
  }

  const finalizeQrSession = async (sessionId: string, voucherUrl: string) => {
      const db = getFirestoreDb();
      const sessionRef = doc(db, 'qr_sessions', sessionId);
      await updateDoc(sessionRef, { voucherUrl });
      await TransactionFlows.processDirectPayment({ sessionId });
      toast({ title: '¡Pago Completado!', description: 'La transacción ha sido registrada exitosamente.' });
  };

  const value: CoraboState = {
    currentUser,
    users,
    allPublications,
    transactions,
    conversations,
    cart,
    searchQuery,
    categoryFilter,
    contacts,
    isGpsActive,
    searchHistory,
    isLoadingAuth,
    deliveryAddress,
    exchangeRate,
    qrSession,
    signInWithGoogle,
    setSearchQuery,
    setCategoryFilter,
    clearSearchHistory,
    logout,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    getDeliveryCost,
    checkout,
    requestService,
    requestQuoteFromGroup,
    sendQuote,
    acceptQuote,
    acceptAppointment,
    completeWork,
    confirmWorkReceived,
    payCommitment,
    confirmPaymentReceived,
    startDispute,
    addContact,
    isContact,
    removeContact,
    toggleGps,
    updateUser,
    updateUserProfileImage,
    removeGalleryImage,
    validateEmail,
    sendPhoneVerification,
    verifyPhoneCode,
    updateFullProfile,
    completeInitialSetup,
    subscribeUser,
    activateTransactions,
    deactivateTransactions,
    downloadTransactionsPDF,
    sendMessage,
    sendProposalMessage,
    acceptProposal,
    createAppointmentRequest,
    getAgendaEvents,
    addCommentToImage,
    removeCommentFromImage,
    getCartItemQuantity,
    activatePromotion,
    createCampaign,
    createPublication,
    createProduct,
    toggleUserPause,
    verifyCampaignPayment,
    verifyUserId,
    rejectUserId,
    autoVerifyIdWithAI,
    markConversationAsRead,
    getUserMetrics,
    fetchUser,
    setDeliveryAddress,
    acceptDelivery,
    getDistanceToProvider,
    startQrSession,
    setQrSessionAmount,
    approveQrSession,
    finalizeQrSession,
    cancelQrSession,
    handleUserAuth,
  };

  return <CoraboContext.Provider value={value}>{children}</CoraboContext.Provider>;
};

export const useCorabo = () => {
  const context = useContext(CoraboContext);
  if (context === undefined) {
    throw new Error('useCorabo must be used within a CoraboProvider');
  }
  return context;
};
export type { Transaction };

    

    



