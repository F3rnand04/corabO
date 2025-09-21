
'use client';

import React, { useState, useEffect, useCallback, createContext } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-provider';
import { addContactToUser, updateUser } from '@/lib/actions/user.actions';
import { updateCart } from '@/lib/actions/cart.actions';
import { haversineDistance } from '@/lib/utils';
import { differenceInMilliseconds } from 'date-fns';
import type { User, Transaction, GalleryImage, CartItem, Product, TempRecipientInfo, QrSession, Notification, Conversation } from '@/lib/types';


// --- Centralized Type Definition and Context Creation ---

export interface CoraboContextValue {
  // Data states
  contacts: User[];
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;
  isContact: (userId: string) => boolean;
  
  users: User[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  allPublications: GalleryImage[];
  setAllPublications: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  
  cart: CartItem[];
  activeCartForCheckout: CartItem[] | null;
  setActiveCartForCheckout: React.Dispatch<React.SetStateAction<CartItem[] | null>>;
  updateCartItem: (product: Product, quantity: number) => void;
  removeCart: (itemsToRemove: CartItem[]) => void;
  
  tempRecipientInfo: TempRecipientInfo | null;
  setTempRecipientInfo: React.Dispatch<React.SetStateAction<TempRecipientInfo | null>>;
  deliveryAddress: string;
  setDeliveryAddress: React.Dispatch<React.SetStateAction<string>>;
  setDeliveryAddressToCurrent: () => void;
  
  currentUserLocation: { latitude: number; longitude: number } | null;
  getCurrentLocation: () => void;
  
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  categoryFilter: string | null;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string | null>>;
  searchHistory: string[];
  clearSearchHistory: () => void;
  
  notifications: Notification[];
  conversations: Conversation[];
  qrSession: QrSession | null;
  
  getUserMetrics: (userId: string, userType: User['type'], allTransactions: Transaction[]) => { reputation: number, effectiveness: number, averagePaymentTimeMs: number };
  getAgendaEvents: (transactions: Transaction[]) => any[];
}

export const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);


// --- CoraboProvider Component ---

export const CoraboProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth(); // Now only depends on the clean AuthContext
  const { toast } = useToast();

  // All application data states are now managed here
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  const [tempRecipientInfo, setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [currentUserLocation, setCurrentUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // This effect handles all real-time data listeners once the user is authenticated.
  useEffect(() => {
    if (!currentUser?.id || !db) {
      setUsers([]); setTransactions([]); setCart([]); setContacts([]);
      setNotifications([]); setConversations([]); setQrSession(null);
      setAllPublications([]);
      return;
    }

    // Listener for the current user's document
    const unsubUser = onSnapshot(doc(db, "users", currentUser.id), (doc) => {
      if (doc.exists()) {
        const updatedUser = doc.data() as User;
        setCart(updatedUser.cart || []);
        
        // Fetch contacts if they exist
        if (updatedUser.contacts && updatedUser.contacts.length > 0) {
            const contactsQuery = query(collection(db, "users"), where('id', 'in', updatedUser.contacts));
            onSnapshot(contactsQuery, (snapshot) => {
                setContacts(snapshot.docs.map(d => d.data() as User));
            });
        } else {
            setContacts([]);
        }
      }
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => doc.data() as User)));
    const unsubTransactions = onSnapshot(query(collection(db, "transactions"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
    const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where('userId', '==', currentUser.id), orderBy('timestamp', 'desc')), (snapshot) => setNotifications(snapshot.docs.map(doc => doc.data() as Notification)));
    const unsubConversations = onSnapshot(query(collection(db, "conversations"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation)));
    const unsubQrSession = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id), where('status', '!=', 'closed')), (snapshot) => setQrSession(snapshot.empty ? null : snapshot.docs[0].data() as QrSession));
    const unsubPublications = onSnapshot(collection(db, "publications"), (snapshot) => setAllPublications(snapshot.docs.map(d => d.data() as GalleryImage)));

    return () => {
      unsubUser(); unsubUsers(); unsubTransactions();
      unsubNotifications(); unsubConversations(); unsubQrSession();
      unsubPublications();
    };
  }, [currentUser?.id]);
  
  // Logic for search history
  useEffect(() => {
    const storedHistory = localStorage.getItem('coraboSearchHistory');
    if (storedHistory) setSearchHistory(JSON.parse(storedHistory));
  }, []);

  useEffect(() => {
      if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
          const newHistory = [searchQuery.trim(), ...searchHistory].slice(0, 10);
          setSearchHistory(newHistory);
          localStorage.setItem('coraboSearchHistory', JSON.stringify(newHistory));
      }
  }, [searchQuery, searchHistory]);
  
  const getCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCurrentUserLocation(location);
          if (currentUser?.id) {
            updateUser(currentUser.id, { 'profileSetupData.location': `${'${location.latitude}'},${'${location.longitude}'}` });
          }
        },
        () => toast({ variant: "destructive", title: "Error de Ubicación", description: "No se pudo obtener tu ubicación. Revisa los permisos." }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  }, [toast, currentUser?.id]);

  const addContact = useCallback(async (user: User) => {
    if (!currentUser) return;
    addContactToUser(currentUser.id, user.id);
  }, [currentUser]);

  const removeContact = useCallback(async (userId: string) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, {
        contacts: arrayRemove(userId)
    });
  }, [currentUser]);

  const isContact = useCallback((userId: string) => currentUser?.contacts?.includes(userId) ?? false, [currentUser?.contacts]);
  
  const updateCartItem = useCallback(async (product: Product, quantity: number) => {
      if (!currentUser) return;
      updateCart(currentUser.id, product.id, quantity);
  }, [currentUser]);

  const removeCart = useCallback(async (itemsToRemove: CartItem[]) => {
      if (!currentUser) return;
      itemsToRemove.forEach(item => {
        updateCart(currentUser.id, item.product.id, 0);
      });
  }, [currentUser]);

  const setDeliveryAddressToCurrent = useCallback(() => {
    getCurrentLocation();
    if (currentUserLocation) setDeliveryAddress(`${'${currentUserLocation.latitude}'},${'${currentUserLocation.longitude}'}`);
    else toast({ variant: "destructive", title: "Ubicación no disponible", description: "No hemos podido obtener tu ubicación GPS." });
  }, [currentUserLocation, toast, getCurrentLocation]);
  
  const clearSearchHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('coraboSearchHistory');
  };
  
  const getUserMetrics = useCallback((userId: string, userType: User['type'], allTransactions: Transaction[]) => {
    const relevantTransactions = allTransactions.filter(tx => (tx.clientId === userId || tx.providerId === userId) && ['Pagado', 'Resuelto'].includes(tx.status));
    const ratedTransactions = relevantTransactions.filter(tx => userType === 'provider' ? tx.details.clientRating : tx.details.providerRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (userType === 'provider' ? tx.details.clientRating! : tx.details.providerRating!), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    const totalDeals = allTransactions.filter(tx => (tx.clientId === userId || tx.providerId === userId) && tx.type !== 'Sistema').length;
    const effectiveness = totalDeals > 0 ? (relevantTransactions.length / totalDeals) * 100 : 100;
    
    const paymentConfirmations = allTransactions.filter(tx => tx.providerId === userId && tx.details.paymentSentAt && tx.details.paymentConfirmationDate).map(tx => differenceInMilliseconds(new Date(tx.details.paymentConfirmationDate!), new Date(tx.details.paymentSentAt!)));
    const averagePaymentTimeMs = paymentConfirmations.length > 0 ? paymentConfirmations.reduce((a, b) => a + b, 0) / paymentConfirmations.length : 0;
    
    return { 
      reputation: isNaN(reputation) ? 5 : reputation, 
      effectiveness: isNaN(effectiveness) ? 100 : Math.min(effectiveness, 100), 
      averagePaymentTimeMs 
    };
  }, []);
  
  const getAgendaEvents = useCallback((transactions: Transaction[]) => transactions.filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status)).map(tx => ({ date: new Date(tx.date), type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment', title: tx.details.serviceName || tx.details.system || 'Evento', transactionId: tx.id })), []);

  const value: CoraboContextValue = {
    contacts, addContact, removeContact, isContact, users, transactions, setTransactions, allPublications, setAllPublications, cart, activeCartForCheckout, setActiveCartForCheckout, updateCartItem, removeCart, tempRecipientInfo, setTempRecipientInfo, deliveryAddress, setDeliveryAddress, setDeliveryAddressToCurrent, currentUserLocation, getCurrentLocation, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, searchHistory, clearSearchHistory, notifications, conversations, qrSession, getUserMetrics, getAgendaEvents
  };

  // Only render children if the user is authenticated. The AuthProvider handles redirection.
  return (
    <CoraboContext.Provider value={value}>
        {currentUser ? children : null}
    </CoraboContext.Provider>
  );
};
