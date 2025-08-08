

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, CredicoraLevel, VerificationOutput, AppointmentRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay, differenceInDays, differenceInHours } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
// Import necessary firebase services directly
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app, db } from '@/lib/firebase'; // Import the initialized app and db
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where, updateDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { createCampaign } from '@/ai/flows/campaign-flow';
import { acceptProposal as acceptProposalFlow, sendMessage as sendMessageFlow } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';


type FeedView = 'servicios' | 'empresas';

interface DailyQuote {
    requestSignature: string;
    count: number;
}

interface CoraboState {
  currentUser: User | null;
  users: User[];
  products: Product[];
  services: Service[];
  cart: CartItem[];
  transactions: Transaction[];
  conversations: Conversation[];
  searchQuery: string;
  contacts: User[];
  feedView: FeedView;
  isGpsActive: boolean;
  searchHistory: string[];
  isLoadingAuth: boolean;
  deliveryAddress: string;
  getRankedFeed: () => (GalleryImage & { provider: User })[];
  signInWithGoogle: () => void;
  setSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  addProduct: (product: Product) => void;
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
  updateUserProfileImage: (userId: string, imageUrl: string) => void;
  updateUserProfileAndGallery: (userId: string, imageOrId: GalleryImage | string, isDelete?: boolean) => void;
  removeGalleryImage: (userId: string, imageId: string) => void;
  validateEmail: (userId: string) => Promise<boolean>;
  validatePhone: (userId: string) => Promise<boolean>;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData) => Promise<void>;
  completeInitialSetup: (userId: string, data: { lastName: string; idNumber: string; birthDate: string }) => Promise<void>;
  subscribeUser: (userId: string, planName: string, amount: number) => void;
  activateTransactions: (userId: string, creditLimit: number) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: () => void;
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => string;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: Omit<AppointmentRequest, 'clientId'>) => void;
  getAgendaEvents: () => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  checkIfShouldBeEnterprise: (providerId: string) => boolean;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => void;
  createCampaign: typeof createCampaign;
  setDeliveryAddress: (address: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  // Admin functions
  toggleUserPause: (userId: string, currentIsPaused: boolean) => void;
  verifyCampaignPayment: (transactionId: string, campaignId: string) => void;
  verifyUserId: (userId: string) => void;
  rejectUserId: (userId: string) => void;
  setIdVerificationPending: (userId: string, documentUrl: string) => Promise<void>;
  autoVerifyIdWithAI: (user: User) => Promise<VerificationOutput>;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

// Import mock data - we'll phase this out
import { users as mockUsers, products as mockProducts, services as mockServices, initialTransactions, initialConversations } from '@/lib/mock-data';

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // We still use mock data for these until we migrate them to Firestore
  const [products, setProducts] = useState(mockProducts);
  const [services, setServices] = useState(mockServices);
  
  const [users, setUsers] = useState<User[]>([]);
  
  // These will be managed by Firestore
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [feedView, setFeedView] = useState<FeedView>('servicios');
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [dailyQuotes, setDailyQuotes] = useState<Record<string, DailyQuote[]>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const auth = getAuth(app);
  
  // Enable offline persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(db)
          .catch((err) => {
              if (err.code === 'failed-precondition') {
                  console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
              } else if (err.code === 'unimplemented') {
                  console.warn("The current browser does not support all of the features required to enable persistence.");
              }
          });
    }
  }, []);

  const handleUserCreation = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
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
        email: firebaseUser.email || '',
        profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        type: 'client',
        reputation: 0,
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
      };
      
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await handleUserCreation(firebaseUser);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [handleUserCreation, auth]);
  

  useEffect(() => {
    if (!currentUser) return;
  
    // Set default delivery address once user loads
    if (currentUser.profileSetupData?.location) {
        setDeliveryAddress(currentUser.profileSetupData.location);
    }
    
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
    }, (error) => console.error("Error fetching users:", error));
  
    const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactions(transactionsData);
    }, (error) => console.error("Error fetching transactions:", error));
    
    const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
        const conversationsData = snapshot.docs.map(doc => doc.data() as Conversation).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setConversations(conversationsData);
    }, (error) => console.error("Error fetching conversations:", error));

  
    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
      unsubscribeConversations();
    };
  }, [currentUser]);

  const getRankedFeed = useCallback(() => {
    if (!currentUser || !users.length) return [];
  
    const allPublications = users
      .filter(u => u.type === 'provider' && u.gallery && u.gallery.length > 0)
      .flatMap(p => p.gallery!.map(g => ({ ...g, provider: p })));
  
    const isNewProvider = (provider: User) => {
      const completedTransactions = transactions.filter(
        tx => tx.providerId === provider.id && (tx.status === 'Pagado' || tx.status === 'Resuelto')
      ).length;
      const accountAgeInDays = provider.createdAt ? differenceInDays(new Date(), new Date(provider.createdAt)) : 999;
      return completedTransactions < 5 && accountAgeInDays < 30;
    };
  
    const calculateScore = (pub: GalleryImage & { provider: User }): number => {
      const provider = pub.provider;
      const isNew = isNewProvider(provider);
  
      if (isNew) {
        // Carril de Oportunidad
        let relevanceScore = 0;
        const userInterests = currentUser.profileSetupData?.categories || [];
        const providerCategories = provider.profileSetupData?.categories || [];
        if (userInterests.some(interest => providerCategories.includes(interest))) {
          relevanceScore = 100;
        }
  
        const hoursSincePublication = pub.createdAt ? differenceInHours(new Date(), new Date(pub.createdAt)) : 9999;
        const freshnessScore = Math.max(0, 100 - hoursSincePublication);
  
        let profileCompleteness = 0;
        if (provider.emailValidated) profileCompleteness += 10;
        if (provider.phoneValidated) profileCompleteness += 10;
        if (provider.profileSetupData?.specialty) profileCompleteness += 10;
        if(provider.gallery && provider.gallery.length > 2) profileCompleteness += 10;
  
        return (relevanceScore * 0.5) + (freshnessScore * 0.4) + (profileCompleteness * 0.1);
      } else {
        // Carril de Confianza
        let qualityScore = 0;
        qualityScore += (provider.reputation || 0) * 10; // Max 50
        if (provider.isSubscribed) qualityScore += 20;
        if (provider.verified) qualityScore += 30;
        // Assuming effectiveness is a percentage from 0 to 100
        // qualityScore += (provider.effectiveness || 0); // Max 100
  
        let relevanceScore = 0;
        const userInterests = currentUser.profileSetupData?.categories || [];
        const providerCategories = provider.profileSetupData?.categories || [];
        if (userInterests.some(interest => providerCategories.includes(interest))) {
          relevanceScore += 50;
        }
        if (contacts.some(c => c.id === provider.id)) {
            relevanceScore += 50; // Big boost for contacts
        }
  
        const hoursSincePublication = pub.createdAt ? differenceInHours(new Date(), new Date(pub.createdAt)) : 9999;
        const freshnessScore = Math.max(0, 100 - (hoursSincePublication / 24)); // Slower decay
  
        return (qualityScore * 0.5) + (relevanceScore * 0.4) + (freshnessScore * 0.1);
      }
    };
    
    const scoredPublications = allPublications.map(pub => ({ ...pub, score: calculateScore(pub) }));
    
    // Separate into two lanes
    const opportunityLane = scoredPublications.filter(p => isNewProvider(p.provider)).sort((a, b) => b.score - a.score);
    const trustLane = scoredPublications.filter(p => !isNewProvider(p.provider)).sort((a, b) => b.score - a.score);

    // Interleave the feeds
    const finalFeed = [];
    let trustIndex = 0;
    let opportunityIndex = 0;

    // Build the feed by interleaving, for example, 1 opportunity for every 3 trust posts
    while (trustIndex < trustLane.length || opportunityIndex < opportunityLane.length) {
        for (let i = 0; i < 3 && trustIndex < trustLane.length; i++) {
            finalFeed.push(trustLane[trustIndex++]);
        }
        if (opportunityIndex < opportunityLane.length) {
            finalFeed.push(opportunityLane[opportunityIndex++]);
        }
    }

    return finalFeed.map(({ score, ...rest }) => rest);
  }, [currentUser, users, transactions, contacts]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      setIsLoadingAuth(true); // Set loading to true before starting sign-in
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.'
      });
      setIsLoadingAuth(false); // Reset loading on error
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        setCurrentUser(null); // Clear user state immediately
        router.push('/login');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  const setSearchQuery = (query: string) => {
    _setSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10)); // Keep last 10 searches
    }
  }
  
  const clearSearchHistory = () => {
    setSearchHistory([]);
  }

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
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
    const provider = users.find(u => u.id === product.providerId);
    if (!provider || !provider.isTransactionsActive) {
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
    const distanceInKm = Math.floor(Math.random() * 5) + 1; // Simulate 1 to 5 km
    return distanceInKm * 1.5; 
  }
  
  const addContact = (user: User) => {
    if (contacts.some(c => c.id === user.id)) return false;
    setContacts(prev => [...prev, user]);
    return true;
  };

  const removeContact = (userId: string) => {
    setContacts(prev => prev.filter(c => c.id !== userId));
  };
  
  const isContact = (userId: string) => {
    return contacts.some(c => c.id === userId);
  }
  
  const updateUser = async (userId: string, updates: Partial<User>) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
    // Optimistically update local state for immediate feedback
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
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
        await sendMessageFlow({
            conversationId: conversationId,
            senderId: currentUser.id,
            proposal: proposal,
            recipientId: conversations.find(c => c.id === conversationId)?.participantIds.find(p => p !== currentUser.id) || ''
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


  // --- Transaction Flows ---
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

  // --- Admin Functions ---
  const toggleUserPause = (userId: string, currentIsPaused: boolean) => {
    updateUser(userId, { isPaused: !currentIsPaused });
  };
  const verifyCampaignPayment = async (transactionId: string, campaignId: string) => {
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
    // This is now a simple Firestore update. The AI flow is called separately from the component.
    await updateUser(userId, { idVerificationStatus: 'pending', idDocumentUrl: documentUrl });
  };
  const autoVerifyIdWithAI = async (user: User) => {
    if (!user.idDocumentUrl) throw new Error("No document URL");
    // This calls the actual Genkit flow
    return await autoVerifyIdWithAIFlow({
      userId: user.id,
      nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
      idInRecord: user.idNumber || '', // Use real data
      documentImageUrl: user.idDocumentUrl
    });
  };


  const requestService = (service: Service) => {};
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => { return true; };
  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {};
  const updateUserProfileImage = (userId: string, imageUrl: string) => {};
  const updateUserProfileAndGallery = (userId: string, imageOrId: GalleryImage | string, isDelete?: boolean) => {};
  const removeGalleryImage = (userId: string, imageId: string) => {};
  
  const validateEmail = async (userId: string): Promise<boolean> => {
    await updateUser(userId, { emailValidated: true });
    return true;
  };
  const validatePhone = async (userId: string): Promise<boolean> => {
    await updateUser(userId, { phoneValidated: true });
    return true;
  };

  const updateFullProfile = async (userId: string, data: Partial<User & { profileSetupData: ProfileSetupData }>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
    
    const wasClient = currentUser?.type === 'client';
    const isNowProvider = data.profileSetupData?.providerType !== undefined;
  
    // Check if the user is transitioning from client to provider
    if (wasClient && isNowProvider && !data.isSubscribed) {
      const welcomeMessage = "¡Felicidades por convertirte en proveedor! Para empezar con el pie derecho y ganar la confianza de tus primeros clientes, te recomendamos suscribirte. Obtendrás la insignia de verificado y acceso a más herramientas. Toca este mensaje para ver los planes.";
      sendMessage('corabo-admin', welcomeMessage); // This will send a message from admin to the user
    }
  };

  const subscribeUser = (userId: string, planName: string, amount: number) => {};
  const activateTransactions = (userId: string, creditLimit: number) => {};
  const deactivateTransactions = (userId: string) => {};
  const downloadTransactionsPDF = () => {};
  const getAgendaEvents = () => { return []; };
  const addCommentToImage = (ownerId: string, imageId: string, commentText: string) => {};
  const removeCommentFromImage = (ownerId: string, imageId: string, commentIndex: number) => {};
  const checkIfShouldBeEnterprise = (providerId: string): boolean => { return false; };
  const activatePromotion = (details: { imageId: string, promotionText: string, cost: number }) => {};

  const value: CoraboState = {
    currentUser,
    users,
    products,
    services,
    cart,
    transactions,
    conversations,
    searchQuery,
    contacts,
    feedView,
    isGpsActive,
    searchHistory,
    isLoadingAuth,
    deliveryAddress,
    getRankedFeed,
    setDeliveryAddress,
    signInWithGoogle,
    setSearchQuery,
    clearSearchHistory,
    logout,
    addToCart,
    addProduct,
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
    updateUserProfileImage,
    updateUserProfileAndGallery,
    removeGalleryImage,
    validateEmail,
    validatePhone,
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
    checkIfShouldBeEnterprise,
    activatePromotion,
    createCampaign,
    toggleUserPause,
    verifyCampaignPayment,
    verifyUserId,
    rejectUserId,
    setIdVerificationPending,
    autoVerifyIdWithAI,
    markConversationAsRead,
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
