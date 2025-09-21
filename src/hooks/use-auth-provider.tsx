
'use client';

import React, { useState, useEffect, useCallback, createContext } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { createSessionCookie, clearSessionCookie } from '@/lib/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { User, Transaction, GalleryImage, CartItem, Product, TempRecipientInfo, QrSession, Notification, Conversation } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { differenceInMilliseconds } from 'date-fns';
import { updateUser } from '@/lib/actions/user.actions';
import { updateCart } from '@/lib/actions/cart.actions';
import { AuthContext, AuthContextValue } from './use-auth';

// AuthProvider Component: Handles auth state and ALL application data
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  // Application Data States
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
  
  // Combined listener for auth and data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // --- DATA LISTENERS ---
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const updatedUser = doc.data() as User;
                setCurrentUser(updatedUser);
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
            } else {
              // This can happen briefly during user creation
              setCurrentUser(null);
            }
            setIsLoadingAuth(false);
        });

        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => doc.data() as User)));
        const unsubTransactions = onSnapshot(query(collection(db, "transactions"), where('participantIds', 'array-contains', fbUser.uid)), (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
        const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where('userId', '==', fbUser.uid), orderBy('timestamp', 'desc')), (snapshot) => setNotifications(snapshot.docs.map(doc => doc.data() as Notification)));
        const unsubConversations = onSnapshot(query(collection(db, "conversations"), where('participantIds', 'array-contains', fbUser.uid)), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation)));
        const unsubQrSession = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', fbUser.uid), where('status', '!=', 'closed')), (snapshot) => setQrSession(snapshot.empty ? null : snapshot.docs[0].data() as QrSession));
        const unsubPublications = onSnapshot(collection(db, "publications"), (snapshot) => setAllPublications(snapshot.docs.map(d => d.data() as GalleryImage)));

        return () => {
          unsubUser(); unsubUsers(); unsubTransactions();
          unsubNotifications(); unsubConversations(); unsubQrSession();
          unsubPublications();
        };

      } else {
        // --- CLEAR ALL STATE ON LOGOUT ---
        setCurrentUser(null);
        setIsLoadingAuth(false);
        setUsers([]); setTransactions([]); setCart([]); setContacts([]);
        setNotifications([]); setConversations([]); setQrSession(null);
        setAllPublications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect for handling client-side routing based on auth state
  useEffect(() => {
    if (isLoadingAuth) return;

    const isAuthPage = pathname === '/login';
    const isSetupPage = pathname === '/initial-setup';

    if (!currentUser && !isAuthPage) {
      router.push('/login');
    } else if (currentUser && !currentUser.isInitialSetupComplete && !isSetupPage) {
      router.push('/initial-setup');
    } else if (currentUser && currentUser.isInitialSetupComplete && (isAuthPage || isSetupPage)) {
      router.push('/');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await clearSessionCookie();
      // State clearing is now handled by the onAuthStateChanged listener
      router.push('/login');
    } catch (error: any) {
      console.error("Error during logout:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
    }
  }, [toast, router]);

  const addContact = useCallback(async (user: User) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, {
        contacts: arrayUnion(user.id)
    });
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
  
  const getCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCurrentUserLocation(location);
          if (currentUser?.id) {
            updateUser(currentUser.id, { 'profileSetupData.location': `${location.latitude},${location.longitude}` });
          }
        },
        () => toast({ variant: "destructive", title: "Error de Ubicación", description: "No se pudo obtener tu ubicación. Revisa los permisos." }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  }, [toast, currentUser?.id]);
  
  const setDeliveryAddressToCurrent = useCallback(() => {
    if (currentUserLocation) {
        setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
    } else {
        getCurrentLocation();
        if(currentUserLocation) setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
        else toast({ variant: "destructive", title: "Ubicación no disponible", description: "Activa el GPS o intenta de nuevo." });
    }
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
    
    const getAgendaEvents = useCallback((transactions: Transaction[]) => {
       return transactions
        .filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status))
        .map(tx => ({
            date: new Date(tx.date),
            type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment',
            transactionId: tx.id,
        }));
    }, []);
  
  const value: AuthContextValue = {
    // Auth
    currentUser, firebaseUser, isLoadingAuth, logout, setCurrentUser,
    // Data
    contacts, addContact, removeContact, isContact, users, transactions, setTransactions, allTransactions, setAllPublications, cart, activeCartForCheckout, setActiveCartForCheckout, updateCartItem, tempRecipientInfo, setTempRecipientInfo, deliveryAddress, setDeliveryAddress, setDeliveryAddressToCurrent, currentUserLocation, getCurrentLocation, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, searchHistory, clearSearchHistory, notifications, conversations, qrSession,
    // Metric getters
    getUserMetrics, getAgendaEvents
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
