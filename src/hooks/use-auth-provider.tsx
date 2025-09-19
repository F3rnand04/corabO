
'use client';

import React, { useState, useEffect, useCallback, createContext } from 'react';
import { signOut, onAuthStateChanged, getIdToken } from 'firebase/auth';
import type { User, Transaction, GalleryImage, CartItem, Product, TempRecipientInfo, QrSession, Notification, Conversation } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase-client';
import { clearSessionCookie, getOrCreateUser, createSessionCookie } from '@/lib/actions/auth.actions';
import { collection, doc, onSnapshot, query, where, updateDoc, FieldValue } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import { differenceInMilliseconds } from 'date-fns';
import { useRouter } from 'next/navigation';
import { AuthContext, type AuthContextValue } from './use-auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  // Data states
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
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // When auth state changes, create a new session cookie
        const idToken = await getIdToken(fbUser);
        await createSessionCookie(idToken);
        const user = await getOrCreateUser(fbUser);
        setCurrentUser(user);
      } else {
        // If user logs out on client, clear the cookie
        await clearSessionCookie();
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.id || !db) {
      // Clear data states if there's no user
      setUsers([]); setTransactions([]); setAllPublications([]); setCart([]); setContacts([]);
      setNotifications([]); setConversations([]); setQrSession(null);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", currentUser.id), (doc) => {
      if (doc.exists()) {
        const updatedUser = doc.data() as User;
        setCurrentUser(prev => prev ? ({...prev, ...updatedUser}) : updatedUser);
        setCart(updatedUser.cart || []);
        
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
    const unsubPublications = onSnapshot(collection(db, "publications"), (snapshot) => setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage)));
    const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where('userId', '==', currentUser.id)), (snapshot) => setNotifications(snapshot.docs.map(doc => doc.data() as Notification)));
    const unsubConversations = onSnapshot(query(collection(db, "conversations"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation)));
    const unsubQrSession = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id), where('status', '!=', 'closed')), (snapshot) => setQrSession(snapshot.empty ? null : snapshot.docs[0].data() as QrSession));

    return () => {
      unsubUser(); unsubUsers(); unsubTransactions(); unsubPublications();
      unsubNotifications(); unsubConversations(); unsubQrSession();
    };
  }, [currentUser?.id]);
  
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // clearSessionCookie is now called inside onAuthStateChanged
      // No need to push, onAuthStateChanged will trigger re-render
      window.location.href = '/'; // Force a full page reload to ensure server state is cleared
    } catch (error: any) {
      console.error("Error during logout:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
    }
  }, [toast]);
  
  const getCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCurrentUserLocation(location);
          if (currentUser?.id && db) {
            const userRef = doc(db, 'users', currentUser.id);
            updateDoc(userRef, { 'profileSetupData.location': `${'${location.latitude}'},${'${location.longitude}'}` });
          }
        },
        () => toast({ variant: "destructive", title: "Error de Ubicación", description: "No se pudo obtener tu ubicación. Revisa los permisos." }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  }, [toast, currentUser?.id]);
  
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
  
  const addContact = useCallback(async (user: User) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, { contacts: FieldValue.arrayUnion(user.id) });
  }, [currentUser]);

  const removeContact = useCallback(async (userId: string) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, { contacts: FieldValue.arrayRemove(userId) });
  }, [currentUser]);

  const isContact = useCallback((userId: string) => currentUser?.contacts?.includes(userId) ?? false, [currentUser?.contacts]);
  
  const updateCartItem = useCallback(async (product: Product, quantity: number) => {
      if (!currentUser || !db) return;
      const newCart = [...cart];
      const itemIndex = newCart.findIndex(item => item.product.id === product.id);
      if (itemIndex > -1) {
          if (quantity > 0) newCart[itemIndex].quantity = quantity;
          else newCart.splice(itemIndex, 1);
      } else if (quantity > 0) {
          newCart.push({ product, quantity });
      }
      setCart(newCart);
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { cart: newCart });
  }, [cart, currentUser]);

  const removeCart = useCallback(async (itemsToRemove: CartItem[]) => {
      if (!currentUser || !db) return;
      const idsToRemove = itemsToRemove.map(item => item.product.id);
      const newCart = cart.filter(item => !idsToRemove.includes(item.product.id));
      setCart(newCart);
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { cart: newCart });
  }, [cart, currentUser]);

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
    const reputation = relevantTransactions.reduce((acc, tx) => (userType === 'provider' ? tx.details.clientRating : tx.details.providerRating) ? acc + (userType === 'provider' ? tx.details.clientRating! : tx.details.providerRating!) : acc, 0) / (relevantTransactions.filter(tx => userType === 'provider' ? tx.details.clientRating : tx.details.providerRating).length || 1);
    const totalDeals = allTransactions.filter(tx => tx.clientId === userId || tx.providerId === userId).length;
    const effectiveness = (relevantTransactions.length / (totalDeals || 1)) * 100;
    const paymentConfirmations = allTransactions.filter(tx => tx.providerId === userId && tx.details.paymentSentAt && tx.details.paymentConfirmationDate).map(tx => differenceInMilliseconds(new Date(tx.details.paymentConfirmationDate!), new Date(tx.details.paymentSentAt!)));
    const averagePaymentTimeMs = paymentConfirmations.length > 0 ? paymentConfirmations.reduce((a, b) => a + b, 0) / paymentConfirmations.length : 0;
    return { reputation: isNaN(reputation) ? 5 : reputation, effectiveness: isNaN(effectiveness) ? 100 : effectiveness, averagePaymentTimeMs };
  }, []);
  
  const getAgendaEvents = useCallback((transactions: Transaction[]) => transactions.filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status)).map(tx => ({ date: new Date(tx.date), type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment', title: tx.details.serviceName || tx.details.system || 'Evento', transactionId: tx.id })), []);

  const value: AuthContextValue = {
    currentUser, firebaseUser, isLoadingAuth: isLoading, logout, setCurrentUser, contacts, addContact, removeContact, isContact, users, transactions, setTransactions, allPublications, setAllPublications, cart, activeCartForCheckout, setActiveCartForCheckout, updateCartItem, removeCart, tempRecipientInfo, setTempRecipientInfo, deliveryAddress, setDeliveryAddress, setDeliveryAddressToCurrent, currentUserLocation, getCurrentLocation, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, searchHistory, clearSearchHistory, notifications, conversations, qrSession, getUserMetrics, getAgendaEvents
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
