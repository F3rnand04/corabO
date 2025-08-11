

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest, PublicationOwner } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirebaseApp, getFirestoreDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, enableIndexedDbPersistence, arrayUnion, getDocs, deleteDoc, collectionGroup, Unsubscribe, orderBy } from 'firebase/firestore';
import { createCampaign } from '@/ai/flows/campaign-flow';
import { acceptProposal as acceptProposalFlow, sendMessage as sendMessageFlow } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow, type VerificationInput } from '@/ai/flows/verification-flow';
import { getExchangeRate } from '@/ai/flows/exchange-rate-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { getFeed as getFeedFlow } from '@/ai/flows/feed-flow';
import { createProduct as createProductFlow, createPublication as createPublicationFlow, type CreatePublicationInput, type CreateProductInput } from '@/ai/flows/publication-flow';


type FeedView = 'servicios' | 'empresas';

interface DailyQuote {
    requestSignature: string;
    count: number;
}

interface UserMetrics {
    reputation: number;
    effectiveness: number;
    responseTime: string; // e.g., "00-05 min", "Nuevo"
}


interface CoraboState {
  currentUser: User | null;
  cart: CartItem[];
  searchQuery: string;
  contacts: User[];
  feedView: FeedView;
  isGpsActive: boolean;
  searchHistory: string[];
  isLoadingAuth: boolean;
  deliveryAddress: string;
  exchangeRate: number;
  signInWithGoogle: () => void;
  setSearchQuery: (query: string) => void;
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
  removeGalleryImage: (userId: string, imageId: string) => void;
  validateEmail: (userId: string, emailToValidate: string) => Promise<boolean>;
  sendPhoneVerification: (userId: string, phone: string) => Promise<void>;
  verifyPhoneCode: (userId: string, code: string) => Promise<boolean>;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider') => Promise<void>;
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
  createCampaign: typeof createCampaign;
  createPublication: (data: CreatePublicationInput) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  setDeliveryAddress: (address: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  toggleUserPause: (userId: string, currentIsPaused: boolean) => void;
  verifyCampaignPayment: (transactionId: string, campaignId: string) => void;
  verifyUserId: (userId: string) => void;
  rejectUserId: (userId: string) => void;
  setIdVerificationPending: (userId: string, documentUrl: string) => Promise<void>;
  autoVerifyIdWithAI: (input: VerificationInput) => Promise<VerificationOutput>;
  getUserMetrics: (userId: string, transactions: Transaction[]) => UserMetrics;
  fetchUser: (userId: string) => Promise<User | null>;
  getFeed: () => Promise<GalleryImage[]>;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

const getUserMetrics = (userId: string, transactions: Transaction[]): UserMetrics => {
    const providerTransactions = transactions.filter(t => t.providerId === userId);
    
    const totalMeaningfulTransactions = providerTransactions.filter(t => t.status !== 'Carrito Activo' && t.status !== 'Pre-factura Pendiente').length;
    if (totalMeaningfulTransactions === 0) {
        return { reputation: 0, effectiveness: 0, responseTime: "Nuevo" };
    }

    const ratedTransactions = providerTransactions.filter(t => (t.status === 'Pagado' || t.status === 'Resuelto') && t.details.clientRating);
    const totalRating = ratedTransactions.reduce((acc, t) => acc + (t.details.clientRating || 0), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 0;
  
    const completedTransactions = providerTransactions.filter(t => t.status === 'Pagado' || t.status === 'Resuelto').length;
    const effectiveness = totalMeaningfulTransactions > 0 ? (completedTransactions / totalMeaningfulTransactions) * 100 : 0;
  
    let responseTime = "Nuevo";
    const paymentConfirmations = providerTransactions
        .filter(t => t.status === 'Pagado' && t.details.paymentReportedDate && t.details.paymentConfirmationDate)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (paymentConfirmations.length > 0) {
      const lastConfirmation = paymentConfirmations[0];
      const reported = new Date(lastConfirmation.details.paymentReportedDate!); 
      const confirmed = new Date(lastConfirmation.details.paymentConfirmationDate!);
      const responseMinutes = differenceInMinutes(confirmed, reported);
      
      if (responseMinutes <= 5) responseTime = "00-05 min";
      else if (responseMinutes <= 15) responseTime = "05-15 min";
      else responseTime = "+15 min";
    }
  
    return { reputation, effectiveness, responseTime };
  };


export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [feedView, setFeedView] = useState<FeedView>('servicios');
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.54);
  
  const app = getFirebaseApp();
  const auth = getAuth(app);
  
  const userCache = useRef<Map<string, User>>(new Map());

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
  
  const getFeed = useCallback(async (): Promise<GalleryImage[]> => {
      try {
          return await getFeedFlow();
      } catch (error) {
          console.error("Error fetching feed via Genkit flow:", error);
          toast({
              variant: 'destructive',
              title: 'Error al Cargar Contenido',
              description: 'No se pudo obtener el contenido del feed. Intenta más tarde.'
          });
          return [];
      }
  }, [toast]);

  const handleUserCreation = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const existingUser = userDocSnap.data() as User;
      userCache.current.set(existingUser.id, existingUser);
      return existingUser;
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
        email: firebaseUser.email || '',
        profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        type: 'client',
        reputation: 0,
        effectiveness: 100,
        phone: '',
        emailValidated: firebaseUser.emailVerified,
        phoneValidated: false,
        isGpsActive: true,
        isInitialSetupComplete: false,
        gallery: [],
        credicoraLevel: 1,
        credicoraLimit: 150,
        profileSetupData: {},
        isSubscribed: false,
        isTransactionsActive: false,
        idVerificationStatus: 'rejected',
      };
      
      await setDoc(userDocRef, newUser);
      userCache.current.set(newUser.id, newUser);
      return newUser;
    }
  }, []);

  useEffect(() => {
    let unsubscribeUser: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        // Clean up previous user listener before setting a new one
        if (unsubscribeUser) {
            unsubscribeUser();
            unsubscribeUser = undefined;
        }
        setCurrentUser(null);

        if (firebaseUser) {
            const userData = await handleUserCreation(firebaseUser);
            // No need to set user here, the listener below will do it.

            const db = getFirestoreDb();
            unsubscribeUser = onSnapshot(doc(db, 'users', userData.id), (doc) => {
                if (doc.exists()) {
                    const updatedUserData = doc.data() as User;
                    setCurrentUser(updatedUserData);
                    userCache.current.set(updatedUserData.id, updatedUserData);

                    if (updatedUserData.profileSetupData?.location) {
                        setDeliveryAddress(updatedUserData.profileSetupData.location);
                    }
                }
            });
        }
        
        setIsLoadingAuth(false);
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUser) {
            unsubscribeUser();
        }
    };
}, [handleUserCreation, auth]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      setIsLoadingAuth(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.'
      });
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        setCurrentUser(null);
        router.push('/login');
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

  const addToCart = (product: Product, quantity: number) => {
    if (!currentUser) return;
    if (!currentUser.isTransactionsActive) {
        toast({
            variant: "destructive",
            title: "Acción Requerida",
            description: "Debes activar tu registro de transacciones para poder comprar."
        });
        return;
    }
    
    // In a real app, you would fetch provider data here. We simulate for now.
    const isProviderTransactionReady = true; 

    if (!isProviderTransactionReady) {
        toast({
            variant: "destructive",
            title: "Proveedor no disponible",
            description: "Este proveedor no tiene las transacciones activas en este momento."
        });
        return;
    }

    if (cart.length > 0 && cart[0].product.providerId !== product.providerId) {
        toast({
            variant: "destructive",
            title: "Carrito Multi-tienda",
            description: "No puedes añadir productos de diferentes tiendas en un mismo carrito. Finaliza esta compra primero."
        });
        return;
    }
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };
  
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (!currentUser || !currentUser.isTransactionsActive) return;
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.product.id !== productId);
      }
      return prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
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
    // State will be updated by the onSnapshot listener, no need to call setCurrentUser here.
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
  const setIdVerificationPending = async (userId: string, documentUrl: string) => {
    await updateUser(userId, { idVerificationStatus: 'pending', idDocumentUrl: documentUrl });
  };
  const autoVerifyIdWithAI = async (input: VerificationInput) => {
    return await autoVerifyIdWithAIFlow(input);
  };

  const createPublication = (data: CreatePublicationInput) => {
    return createPublicationFlow(data);
  };
  
  const createProduct = (data: CreateProductInput) => {
      return createProductFlow(data);
  };


  const requestService = (service: Service) => {};
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => { return true; };
  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {};
  
  const updateUserProfileImage = async (userId: string, imageUrl: string) => {
     await updateUser(userId, { profileImage: imageUrl });
  };

  const removeGalleryImage = async (userId: string, imageId: string) => {
    if(!currentUser) return;
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    
    const userGalleryRef = doc(db, 'users', userId, 'gallery', imageId);
    batch.delete(userGalleryRef);

    // Also delete the public publication
    const publicationRef = doc(db, 'publications', imageId);
    batch.delete(publicationRef);

    await batch.commit();

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

  const updateFullProfile = async (userId: string, data: ProfileSetupData, profileType: 'client' | 'provider') => {
    if (!currentUser) return;
    
    const wasClient = currentUser.type === 'client';
    const isNowProvider = profileType === 'provider';
    
    const updates: Partial<User> = {
        profileSetupData: data,
        type: profileType,
    };
    
    await updateUser(userId, updates);
    
    // Centrally trigger welcome notification from the context after the state has been successfully updated
    if (wasClient && isNowProvider) {
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
      const initialCreditLimit = credicoraLevels['1'].creditLimit;

      const cleanedPaymentDetails = { ...paymentDetails };
      
      const updates = {
          isTransactionsActive: true,
          credicoraLimit: initialCreditLimit,
          profileSetupData: {
              ...currentUser.profileSetupData,
              paymentDetails: cleanedPaymentDetails,
          },
      };

      await updateDoc(userRef, updates);
  };
  
  const deactivateTransactions = (userId: string) => {};
  const downloadTransactionsPDF = (transactions: Transaction[]) => {};
  const getAgendaEvents = (transactions: Transaction[]): { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[] => { return []; };
  const addCommentToImage = (ownerId: string, imageId: string, commentText: string) => {};
  const removeCommentFromImage = (ownerId: string, imageId: string, commentIndex: number) => {};
  const activatePromotion = (details: { imageId: string, promotionText: string, cost: number }) => {};
  
  const value: CoraboState = {
    currentUser,
    cart,
    searchQuery,
    contacts,
    feedView,
    isGpsActive,
    searchHistory,
    isLoadingAuth,
    deliveryAddress,
    exchangeRate,
    signInWithGoogle,
    setSearchQuery,
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
    setFeedView,
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
    setIdVerificationPending,
    autoVerifyIdWithAI,
    markConversationAsRead,
    getUserMetrics,
    fetchUser,
    setDeliveryAddress,
    getFeed,
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
