
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AppointmentRequest, AgreementProposal, CredicoraLevel, Campaign } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay } from 'date-fns';
import { credicoraLevels } from '@/lib/types';
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';

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
  addContact: (user: User) => Promise<boolean>;
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
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => Promise<string>;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: AppointmentRequest) => void;
  getAgendaEvents: () => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  checkIfShouldBeEnterprise: (providerId: string) => boolean;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => void;
  createCampaign: (campaignDetails: Omit<CreateCampaignInput, 'userId'>) => void;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // These will now be populated from Firestore
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, _setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [feedView, setFeedView] = useState<FeedView>('servicios');
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [dailyQuotes, setDailyQuotes] = useState<Record<string, DailyQuote[]>>({});
  
  // Effect for Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as User);
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
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Effects for Firestore data
   useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => doc.data() as Product));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "services"), (snapshot) => {
      setServices(snapshot.docs.map(doc => doc.data() as Service));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setConversations([]);
      setContacts([]);
      return;
    };
    
    const transQuery = query(collection(db, "transactions"), where("participantIds", "array-contains", currentUser.id));
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    });

    const convoQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id));
    const unsubConvos = onSnapshot(convoQuery, (snapshot) => {
      setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
    });

    const contactsQuery = query(collection(db, `users/${currentUser.id}/contacts`));
    const unsubContacts = onSnapshot(contactsQuery, (snapshot) => {
      setContacts(snapshot.docs.map(doc => doc.data() as User));
    });


    return () => {
      unsubTrans();
      unsubConvos();
      unsubContacts();
    };
  }, [currentUser]);


  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
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

  // Helper to update a document in a collection
  const updateDocument = async (collectionName: string, docId: string, data: any) => {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
  }

  const findOrCreateCartTransaction = async (): Promise<Transaction> => {
    if (!currentUser) throw new Error("User not authenticated");
    const cartTxsQuery = query(collection(db, "transactions"), 
        where("clientId", "==", currentUser.id),
        where("status", "==", "Carrito Activo")
    );
    const querySnapshot = await getDocs(cartTxsQuery);
    
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Transaction;
    }

    const txId = `txn-${Date.now()}`;
    const newCartTx: Transaction = {
      id: txId,
      type: 'Compra',
      status: 'Carrito Activo',
      date: new Date().toISOString(),
      amount: 0,
      clientId: currentUser.id,
      participantIds: [currentUser.id],
      details: {
        items: [],
        delivery: false,
        deliveryCost: 0,
      },
    };
    await setDoc(doc(db, "transactions", txId), newCartTx);
    return newCartTx;
  };
  
  const addToCart = async (product: Product, quantity: number) => {
    if (!currentUser) return;
    if (!currentUser.isTransactionsActive) {
        toast({ variant: 'destructive', title: "Acción Requerida", description: "Debes activar tu registro de transacciones para poder comprar." });
        return;
    }
    const provider = users.find(u => u.id === product.providerId);
    if (!provider || !provider.isTransactionsActive) {
      toast({ variant: 'destructive', title: "Proveedor no disponible", description: "Este proveedor no tiene activas las transacciones en este momento."});
      return;
    }

    let cartTx = await findOrCreateCartTransaction();

    if (cart.length > 0 && cartTx.providerId && cartTx.providerId !== product.providerId) {
        toast({
            variant: "destructive",
            title: "Carrito Multi-empresa",
            description: "No puedes añadir productos de diferentes empresas en el mismo carrito. Finaliza esta compra primero."
        });
        return;
    }
    
    const existingItem = cart.find((item) => item.product.id === product.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newCart = [...cart, { product, quantity }];
    }
    setCart(newCart); // Optimistic update for UI

    // Update Firestore transaction
     await updateDocument("transactions", cartTx.id, {
        providerId: product.providerId,
        participantIds: [currentUser.id, product.providerId],
        'details.items': newCart,
        amount: newCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    });
  };
  
  const updateCartQuantity = async (productId: string, quantity: number) => {
     if (!currentUser || !currentUser.isTransactionsActive) {
        toast({ variant: 'destructive', title: "Acción Requerida", description: "Tu registro de transacciones debe estar activo." });
        return;
    }
    let cartTx = await findOrCreateCartTransaction();

    const newCart = cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
    ).filter(item => item.quantity > 0);
    
    setCart(newCart); // Optimistic update

    await updateDocument("transactions", cartTx.id, {
        'details.items': newCart,
        amount: newCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    });
  };

  const removeFromCart = (productId: string) => {
    updateCartQuantity(productId, 0);
  };
  
  // ... (Other functions need to be adapted similarly to use updateDocument or other firestore methods)
  // This is a simplified context of what would be needed. Many functions below are not yet adapted for brevity.

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  
  const getDeliveryCost = () => {
    const distanceInKm = Math.floor(Math.random() * 5) + 1; // Simulate 1 to 5 km
    return distanceInKm * 1.5; 
  }
  
  const addContact = async (user: User): Promise<boolean> => {
    if (!currentUser) return false;
    const contactRef = doc(db, `users/${currentUser.id}/contacts`, user.id);
    const contactSnap = await getDoc(contactRef);
    if (contactSnap.exists()) {
        return false;
    }
    await setDoc(contactRef, user);
    return true;
  };

  const removeContact = async (userId: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, `users/${currentUser.id}/contacts`, userId));
  };
  
  const isContact = (userId: string) => {
    return contacts.some(c => c.id === userId);
  }
  
  const updateUser = async (userId: string, updates: Partial<User>) => {
    await updateDocument("users", userId, updates);
  };
  
   const sendMessage = async (recipientId: string, text: string, createOnly: boolean = false): Promise<string> => {
    if (!currentUser) throw new Error("No user logged in");
    
    const convoId = [currentUser.id, recipientId].sort().join('_');
    const convoRef = doc(db, "conversations", convoId);
    const convoSnap = await getDoc(convoRef);

    if (!convoSnap.exists()) {
        const newConversation = {
            id: convoId,
            participantIds: [currentUser.id, recipientId],
            messages: [],
            lastUpdated: new Date().toISOString(),
        };
        await setDoc(convoRef, newConversation);
    }
    
    if (createOnly && !text) {
      return convoId;
    }

    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        text,
        timestamp: new Date().toISOString(),
        type: 'text',
    };
    
    const currentMessages = convoSnap.exists() ? convoSnap.data().messages : [];

    await updateDocument("conversations", convoId, {
      messages: [...currentMessages, newMessage],
      lastUpdated: new Date().toISOString(),
    });
    
    return convoId;
  };

  const createCampaign = async (campaignDetails: Omit<CreateCampaignInput, 'userId'>) => {
    if (!currentUser) {
        toast({ variant: "destructive", title: "No autenticado", description: "Debes iniciar sesión para crear una campaña." });
        return;
    }
    try {
        const newCampaign = await createCampaignFlow({ ...campaignDetails, userId: currentUser.id });
        toast({
            title: "¡Campaña en Revisión!",
            description: `Tu campaña "${newCampaign.id}" ha sido creada y está pendiente de pago.`,
        });
    } catch (error) {
        console.error("Error creating campaign:", error);
        toast({
            variant: "destructive",
            title: "Error al Crear Campaña",
            description: "No se pudo crear la campaña. Por favor, intenta de nuevo.",
        });
    }
  };


  // Remaining functions need full Firestore implementation...
  const addProduct = async (product: Product) => { await setDoc(doc(db, "products", product.id), product); };
  const requestService = (service: Service) => { console.log("requestService not implemented with Firestore") };
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => { console.log("requestQuoteFromGroup not implemented with Firestore"); return true; };
  const sendQuote = (transactionId: string, quote: { breakdown: string; total: number }) => { console.log("sendQuote not implemented with Firestore") };
  const acceptQuote = (transactionId: string) => { console.log("acceptQuote not implemented with Firestore") };
  const acceptAppointment = (transactionId: string) => { console.log("acceptAppointment not implemented with Firestore") };
  const payCommitment = (transactionId: string, rating?: number, comment?: string) => { console.log("payCommitment not implemented with Firestore") };
  const confirmPaymentReceived = (transactionId: string, fromThirdParty: boolean) => { console.log("confirmPaymentReceived not implemented with Firestore") };
  const completeWork = (transactionId: string) => { console.log("completeWork not implemented with Firestore") };
  const confirmWorkReceived = (transactionId: string, rating: number, comment?: string) => { console.log("confirmWorkReceived not implemented with Firestore") };
  const startDispute = (transactionId: string) => { console.log("startDispute not implemented with Firestore") };
  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => { console.log("checkout not implemented with Firestore") };
  const toggleGps = (userId: string) => { console.log("toggleGps not implemented with Firestore") };
  const updateUserProfileImage = (userId: string, imageUrl: string) => { console.log("updateUserProfileImage not implemented with Firestore") };
  const updateUserProfileAndGallery = (userId: string, imageOrId: GalleryImage | string, isDelete?: boolean) => { console.log("updateUserProfileAndGallery not implemented with Firestore") };
  const removeGalleryImage = (userId: string, imageId: string) => { console.log("removeGalleryImage not implemented with Firestore") };
  const validateEmail = (userId: string) => { console.log("validateEmail not implemented with Firestore") };
  const validatePhone = (userId: string) => { console.log("validatePhone not implemented with Firestore") };
  const updateFullProfile = (userId: string, data: ProfileSetupData) => { console.log("updateFullProfile not implemented with Firestore") };
  const subscribeUser = (userId: string, planName: string, amount: number) => { console.log("subscribeUser not implemented with Firestore") };
  const activateTransactions = (userId: string, creditLimit: number) => { console.log("activateTransactions not implemented with Firestore") };
  const deactivateTransactions = (userId: string) => { console.log("deactivateTransactions not implemented with Firestore") };
  const downloadTransactionsPDF = () => { console.log("downloadTransactionsPDF not implemented with Firestore") };
  const sendProposalMessage = (conversationId: string, proposal: AgreementProposal) => { console.log("sendProposalMessage not implemented with Firestore") };
  const acceptProposal = (conversationId: string, messageId: string) => { console.log("acceptProposal not implemented with Firestore") };
  const createAppointmentRequest = (request: AppointmentRequest) => { console.log("createAppointmentRequest not implemented with Firestore") };
  const getAgendaEvents = () => { console.log("getAgendaEvents not implemented with Firestore"); return []; };
  const addCommentToImage = (ownerId: string, imageId: string, commentText: string) => { console.log("addCommentToImage not implemented with Firestore") };
  const removeCommentFromImage = (ownerId: string, imageId: string, commentIndex: number) => { console.log("removeCommentFromImage not implemented with Firestore") };
  const checkIfShouldBeEnterprise = (providerId: string): boolean => { console.log("checkIfShouldBeEnterprise not implemented with Firestore"); return false; };
  const activatePromotion = (details: { imageId: string, promotionText: string, cost: number }) => { console.log("activatePromotion not implemented with Firestore") };

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
