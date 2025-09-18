
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { signOut, onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import type { User, Transaction, GalleryImage, CartItem, Product, TempRecipientInfo, QrSession, Notification, Conversation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase-client';
import { addContactToUser, removeContactFromUser, updateCartInFirestore } from '@/lib/actions/user.actions';
import { createSessionCookie, clearSessionCookie, getOrCreateUser } from '@/lib/actions/auth.actions';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { haversineDistance } from '@/lib/utils';
import { differenceInMilliseconds } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext, type AuthContextValue } from './use-auth';

interface AuthProviderProps {
  initialUser: User | null;
  children: React.ReactNode;
}

export const AuthProvider = ({ initialUser, children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const initialAuthChecked = useRef(false);

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
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const wasUser = !!firebaseUser;
      setFirebaseUser(user);

      if (user) {
        const idToken = await user.getIdToken();
        await createSessionCookie(idToken);
        const userProfile = await getOrCreateUser(user);
        setCurrentUser(userProfile);
      } else {
        await clearSessionCookie();
        setCurrentUser(null);
      }

      // Only trigger a reload if the auth state *changes* (login/logout), not on initial load.
      if (initialAuthChecked.current && wasUser !== !!user) {
        window.location.reload();
      }
      
      // Mark initial check as complete and stop the main loader
      initialAuthChecked.current = true;
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!currentUser?.id || !db) {
        // If there's no user, we can confidently say auth loading is done.
        if(!currentUser) setIsLoadingAuth(false);
        return;
    };

    const unsubUser = onSnapshot(doc(db, "users", currentUser.id), (doc) => {
      if (doc.exists()) {
        const updatedUser = doc.data() as User;
        setCurrentUser(prev => ({...prev, ...updatedUser}));
        setCart(updatedUser.cart || []);
        
        if (updatedUser.contacts && updatedUser.contacts.length > 0) {
            const contactsQuery = query(collection(db, "users"), where('id', 'in', updatedUser.contacts));
            const unsubContacts = onSnapshot(contactsQuery, (snapshot) => {
                setContacts(snapshot.docs.map(d => d.data() as User));
            });
            return () => unsubContacts();
        } else {
            setContacts([]);
        }
      }
    });
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    const unsubTransactions = onSnapshot(query(collection(db, "transactions"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => {
        setTransactions(snapshot.docs.map(doc => doc.data() as Transaction).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    
    const unsubPublications = onSnapshot(collection(db, "publications"), (snapshot) => {
      setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    });

    const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where('userId', '==', currentUser.id)), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => doc.data() as Notification));
    });

     const unsubConversations = onSnapshot(query(collection(db, "conversations"), where('participantIds', 'array-contains', currentUser.id)), (snapshot) => {
        setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
    });

    const unsubQrSession = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', currentUser.id), where('status', '!=', 'closed')), (snapshot) => {
       if (!snapshot.empty) {
           setQrSession(snapshot.docs[0].data() as QrSession);
       } else {
           setQrSession(null);
       }
    });

    return () => {
      unsubUser();
      unsubUsers();
      unsubTransactions();
      unsubPublications();
      unsubNotifications();
      unsubConversations();
      unsubQrSession();
    };
  }, [currentUser?.id]);
  
  const logout = useCallback(async () => {
    try {
        await signOut(auth); // This will trigger onIdTokenChanged
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
    }
  }, [toast]);
  
  const getCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (currentUser?.id) {
            import('@/lib/actions/user.actions').then(actions => {
              actions.toggleGps(currentUser.id);
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          toast({
            variant: "destructive",
            title: "Error de Ubicación",
            description: "No se pudo obtener tu ubicación. Revisa los permisos del navegador."
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  }, [toast, currentUser?.id]);
  
  useEffect(() => {
    const storedHistory = localStorage.getItem('coraboSearchHistory');
    if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
    }
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
    await addContactToUser(currentUser.id, user.id);
  }, [currentUser]);

  const removeContact = useCallback(async (userId: string) => {
    if (!currentUser) return;
    await removeContactFromUser(currentUser.id, userId);
  }, [currentUser]);

  const isContact = useCallback((userId: string) => {
    if (!currentUser?.contacts) return false;
    return currentUser.contacts.includes(userId);
  }, [currentUser?.contacts]);
  
  const updateCartItem = useCallback(async (product: Product, quantity: number) => {
      if (!currentUser) return;
      const newCart = [...cart];
      const itemIndex = newCart.findIndex(item => item.product.id === product.id);
      
      if (itemIndex > -1) {
          if (quantity > 0) {
              newCart[itemIndex].quantity = quantity;
          } else {
              newCart.splice(itemIndex, 1);
          }
      } else if (quantity > 0) {
          newCart.push({ product, quantity });
      }
      setCart(newCart);
      await updateCartInFirestore(currentUser.id, newCart);

  }, [cart, currentUser]);

  const removeCart = useCallback(async (itemsToRemove: CartItem[]) => {
      if (!currentUser) return;
      const idsToRemove = itemsToRemove.map(item => item.product.id);
      const newCart = cart.filter(item => !idsToRemove.includes(item.product.id));
      setCart(newCart);
      await updateCartInFirestore(currentUser.id, newCart);
  }, [cart, currentUser]);

  const setDeliveryAddressToCurrent = useCallback(() => {
    getCurrentLocation();
    if (currentUserLocation) {
        setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
    } else {
        toast({
            variant: "destructive",
            title: "Ubicación no disponible",
            description: "No hemos podido obtener tu ubicación GPS. Activa los permisos y vuelve a intentarlo.",
        });
    }
  }, [currentUserLocation, toast, getCurrentLocation]);
  
  const clearSearchHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('coraboSearchHistory');
  };
  
  const getUserMetrics = useCallback((userId: string, userType: User['type'], allTransactions: Transaction[]) => {
    const relevantTransactions = allTransactions.filter(tx => 
        (tx.clientId === userId || tx.providerId === userId) && ['Pagado', 'Resuelto'].includes(tx.status)
    );

    const reputation = relevantTransactions.reduce((acc, tx) => {
        const rating = userType === 'provider' ? tx.details.clientRating : tx.details.providerRating;
        return rating ? acc + rating : acc;
    }, 0) / (relevantTransactions.filter(tx => (userType === 'provider' ? tx.details.clientRating : tx.details.providerRating)).length || 1);

    const totalDeals = allTransactions.filter(tx => tx.clientId === userId || tx.providerId === userId).length;
    const effectiveness = (relevantTransactions.length / (totalDeals || 1)) * 100;
    
    const paymentConfirmations = allTransactions
        .filter(tx => tx.providerId === userId && tx.details.paymentSentAt && tx.details.paymentConfirmationDate)
        .map(tx => differenceInMilliseconds(new Date(tx.details.paymentConfirmationDate!), new Date(tx.details.paymentSentAt!)));
    
    const averagePaymentTimeMs = paymentConfirmations.length > 0
        ? paymentConfirmations.reduce((a, b) => a + b, 0) / paymentConfirmations.length
        : 0;
        
    return { reputation: isNaN(reputation) ? 5 : reputation, effectiveness: isNaN(effectiveness) ? 100 : effectiveness, averagePaymentTimeMs };
  }, []);
  
  const getAgendaEvents = useCallback((transactions: Transaction[]) => {
      return transactions.filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status)).map(tx => ({
          date: new Date(tx.date),
          type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment',
          title: tx.details.serviceName || tx.details.system || 'Evento',
          transactionId: tx.id,
      }));
  }, []);

  const value: AuthContextValue = {
    currentUser,
    firebaseUser,
    isLoadingAuth,
    logout,
    setCurrentUser,
    contacts,
    addContact,
    removeContact,
    isContact,
    users,
    transactions,
    setTransactions,
    allPublications,
    setAllPublications,
    cart,
    activeCartForCheckout,
    setActiveCartForCheckout,
    updateCartItem,
    removeCart,
    tempRecipientInfo,
    setTempRecipientInfo,
    deliveryAddress,
    setDeliveryAddress,
    setDeliveryAddressToCurrent,
    currentUserLocation,
    getCurrentLocation,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    searchHistory,
    clearSearchHistory,
    notifications,
    conversations,
    qrSession,
    getUserMetrics,
    getAgendaEvents,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
