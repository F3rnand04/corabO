
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AppointmentRequest, AgreementProposal, CredicoraLevel } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch, collection, onSnapshot, query, where } from 'firebase/firestore';
import { createCampaign } from '@/ai/flows/campaign-flow';
import { acceptProposal as acceptProposalFlow, sendMessage as sendMessageFlow } from '@/ai/flows/message-flow';


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
  validateEmail: (userId: string) => void;
  validatePhone: (userId: string) => void;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData) => void;
  subscribeUser: (userId: string, planName: string, amount: number) => void;
  activateTransactions: (userId: string, creditLimit: number) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: () => void;
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => string;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: AppointmentRequest) => void;
  getAgendaEvents: () => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  checkIfShouldBeEnterprise: (providerId: string) => boolean;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => void;
  createCampaign: typeof createCampaign;
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
  
  const [users, setUsers] = useState<User[]>([]); // Will be replaced by Firestore users
  
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
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let appUser: User;
        if (userDocSnap.exists()) {
          appUser = userDocSnap.data() as User;
        } else {
          // Create a new user if they don't exist
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Nuevo Usuario',
            email: firebaseUser.email || '',
            profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            type: 'client',
            reputation: 0,
            phone: firebaseUser.phoneNumber || '',
            emailValidated: firebaseUser.emailVerified,
            phoneValidated: false,
            isGpsActive: true,
            gallery: [],
            credicoraLevel: 1,
            credicoraLimit: 150,
          };
          await setDoc(userDocRef, newUser);
          appUser = newUser;
        }
        
        setCurrentUser(appUser);
        
        // This part would be replaced by a Firestore listener
        // setTransactions(initialTransactions.filter(t => t.clientId === appUser.id || t.providerId === appUser.id));
        // setUsers(prevUsers => {
        //   const userExists = prevUsers.some(u => u.id === appUser.id);
        //   if (userExists) {
        //     return prevUsers.map(u => u.id === appUser.id ? appUser : u);
        //   }
        //   return [...prevUsers, appUser];
        // });

      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
  
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
    });
  
    const transactionsQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactions(transactionsData);
    });
    
    const conversationsQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => doc.data() as Conversation);
      setConversations(conversationsData);
    });

  
    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
      unsubscribeConversations();
    };
  }, [currentUser]);


  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.'
      });
    }
  };

  const logout = () => {
    signOut(auth);
    router.push('/login');
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
            description: "Este proveedor no tiene activas las transacciones en este momento."
        });
      return;
    }

    if (cart.length > 0 && cart[0].product.providerId !== product.providerId) {
        toast({
            variant: "destructive",
            title: "Carrito Multi-empresa",
            description: "No puedes añadir productos de diferentes empresas en el mismo carrito. Finaliza esta compra primero."
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
    await setDoc(userDocRef, updates, { merge: true });
    // State will be updated by the listener
  };
  
  const sendMessage = (recipientId: string, text: string, createOnly: boolean = false): string => {
    if (!currentUser) return '';
    const convoId = [currentUser.id, recipientId].sort().join('_');
    
    if (createOnly) {
      // Just ensure the conversation exists without sending a message
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
        console.error("Error sending proposal:", error);
        toast({ variant: 'destructive', title: 'Error al enviar la propuesta' });
    }
  };

  const acceptProposal = async (conversationId: string, messageId: string) => {
    if (!currentUser) return;
    try {
      await acceptProposalFlow({ conversationId, messageId, acceptorId: currentUser.id });
      toast({ title: '¡Acuerdo Aceptado!', description: 'Se ha creado un nuevo compromiso de pago.' });
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast({ variant: 'destructive', title: 'Error al aceptar la propuesta' });
    }
  };


  // The rest of the functions would need similar refactoring...
  const requestService = (service: Service) => {};
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => { return true; };
  const sendQuote = (transactionId: string, quote: { breakdown: string; total: number }) => {};
  const acceptQuote = (transactionId: string) => {};
  const acceptAppointment = (transactionId: string) => {};
  const payCommitment = (transactionId: string, rating?: number, comment?: string) => {};
  const confirmPaymentReceived = (transactionId: string, fromThirdParty: boolean) => {};
  const completeWork = (transactionId: string) => {};
  const confirmWorkReceived = (transactionId: string, rating: number, comment?: string) => {};
  const startDispute = (transactionId: string) => {};
  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {};
  const toggleGps = (userId: string) => {};
  const updateUserProfileImage = (userId: string, imageUrl: string) => {};
  const updateUserProfileAndGallery = (userId: string, imageOrId: GalleryImage | string, isDelete?: boolean) => {};
  const removeGalleryImage = (userId: string, imageId: string) => {};
  const validateEmail = (userId: string) => {};
  const validatePhone = (userId: string) => {};
  const updateFullProfile = (userId: string, data: ProfileSetupData) => {};
  const subscribeUser = (userId: string, planName: string, amount: number) => {};
  const activateTransactions = (userId: string, creditLimit: number) => {};
  const deactivateTransactions = (userId: string) => {};
  const downloadTransactionsPDF = () => {};
  const createAppointmentRequest = (request: AppointmentRequest) => {};
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
    updateFullProfile,
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
