'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { clearSessionCookie, getOrCreateUser } from '@/lib/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import type { User, Transaction, GalleryImage, CartItem, TempRecipientInfo, QrSession, Notification, Conversation, FirebaseUserInput } from '@/lib/types';
import { updateUser } from '@/lib/actions/user.actions';
import { differenceInMilliseconds } from 'date-fns';

// --- Centralized Context Definition ---

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  
  // Data states
  contacts: User[];
  isContact: (userId: string) => boolean;
  removeContact: (contactId: string) => Promise<void>;
  
  users: User[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  allPublications: GalleryImage[];
  setAllPublications: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  
  cart: CartItem[];
  activeCartForCheckout: CartItem[] | null;
  setActiveCartForCheckout: React.Dispatch<React.SetStateAction<CartItem[] | null>>;
  
  tempRecipientInfo: TempRecipientInfo | null;
  setTempRecipientInfo: React.Dispatch<React.SetStateAction<TempRecipientInfo | null>>;
  deliveryAddress: string;
  setDeliveryAddress: React.Dispatch<React.SetStateAction<string>>;
  setDeliveryAddressToCurrent: () => Promise<void>;
  
  currentUserLocation: { latitude: number; longitude: number } | null;
  getCurrentLocation: () => Promise<{ latitude: number, longitude: number }>;
  
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  categoryFilter: string | null;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string | null>>;
  searchHistory: string[];
  clearSearchHistory: () => void;
  addSearchToHistory: (query: string) => void;
  
  notifications: Notification[];
  conversations: Conversation[];
  qrSession: QrSession | null;
  
  getUserMetrics: (userId: string, userType: User['type'], allTransactions: Transaction[]) => { reputation: number, effectiveness: number, averagePaymentTimeMs: number };
  getAgendaEvents: (transactions: Transaction[]) => any[];
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Centralized Hook ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// --- AuthProvider Component ---

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Load search history from local storage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem('coraboSearchHistory');
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        // Error loading from localStorage is not critical
      }
    }
  }, []);
  
  // Combined listener for auth and data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userInput: FirebaseUserInput = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified
        };
        
        await getOrCreateUser(userInput);
        
        // --- DATA LISTENERS ---
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const updatedUser = doc.data() as User;
                setCurrentUser(updatedUser);
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
            setIsLoadingAuth(false);
        });

        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => doc.data() as User)));
        const unsubTransactions = onSnapshot(query(collection(db, "transactions"), where('participantIds', 'array-contains', fbUser.uid)), (snapshot) => setTransactions(snapshot.docs.map(doc => doc.data() as Transaction).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
        const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where('userId', '==', fbUser.uid), orderBy('timestamp', 'desc')), (snapshot) => setNotifications(snapshot.docs.map(doc => doc.data() as Notification)));
        const unsubConversations = onSnapshot(query(collection(db, "conversations"), where('participantIds', 'array-contains', fbUser.uid)), (snapshot) => setConversations(snapshot.docs.map(doc => doc.data() as Conversation)));
        const unsubQrSession = onSnapshot(query(collection(db, "qr_sessions"), where('participantIds', 'array-contains', fbUser.uid), where('status', 'in', ['active', 'pending'])), (snapshot) => setQrSession(snapshot.empty ? null : snapshot.docs[0].data() as QrSession));
        const unsubPublications = onSnapshot(collection(db, "publications"), (snapshot) => setAllPublications(snapshot.docs.map(d => d.data() as GalleryImage)));

        return () => {
          unsubUser(); unsubUsers(); unsubTransactions();
          unsubNotifications(); unsubConversations(); unsubQrSession();
          unsubPublications();
        };

      } else {
        setCurrentUser(null);
        setIsLoadingAuth(false);
        setUsers([]); setTransactions([]); setCart([]); setContacts([]);
        setNotifications([]); setConversations([]); setQrSession(null);
        setAllPublications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return;

    const isAuthPage = pathname === '/login';
    const isSetupPage = pathname.startsWith('/profile-setup');

    if (!currentUser && !isAuthPage) {
      router.push('/login');
    } else if (currentUser && !currentUser.isInitialSetupComplete && !isSetupPage) {
      router.push('/profile-setup');
    } else if (currentUser && currentUser.isInitialSetupComplete && (isAuthPage || isSetupPage)) {
      router.push('/');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await clearSessionCookie();
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
    }
  }, [router, toast]);

  const isContact = useCallback((userId: string) => currentUser?.contacts?.includes(userId) ?? false, [currentUser?.contacts]);

  const removeContact = useCallback(async (contactId: string) => {
    if (!currentUser) return;
    try {
      const updatedContacts = currentUser.contacts?.filter(id => id !== contactId) ?? [];
      await updateUser(currentUser.id, { contacts: updatedContacts });
      toast({ title: 'Contacto eliminado', description: 'El contacto ha sido eliminado de tu lista.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el contacto.' });
    }
  }, [currentUser, toast]);
  
  const getCurrentLocation = useCallback((): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    setCurrentUserLocation(location);
                    if (currentUser?.id) {
                        updateUser(currentUser.id, { 'profileSetupData.location': `${location.latitude},${location.longitude}` });
                    }
                    resolve(location);
                },
                (error) => {
                    toast({ variant: "destructive", title: "Error de Ubicación", description: "No se pudo obtener tu ubicación. Revisa los permisos." });
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
            );
        } else {
            const error = new Error("Geolocation is not supported by this browser.");
            toast({ variant: "destructive", title: "Error de Ubicación", description: error.message });
            reject(error);
        }
    });
}, [currentUser?.id, toast]);
  
  const setDeliveryAddressToCurrent = useCallback(async () => {
    if (currentUserLocation) {
        setDeliveryAddress(`${currentUserLocation.latitude},${currentUserLocation.longitude}`);
        return;
    }
    try {
        const location = await getCurrentLocation();
        setDeliveryAddress(`${location.latitude},${location.longitude}`);
    } catch (error) {
        // Silently fail if location cannot be obtained
    }
  }, [currentUserLocation, getCurrentLocation]);
  
  const clearSearchHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        setSearchHistory([]);
        localStorage.removeItem('coraboSearchHistory');
      } catch (error) {
        // Not critical
      }
    }
  };

  const addSearchToHistory = (query: string) => {
    if (!query) return;
    if (typeof window !== 'undefined') {
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 10);
        try {
          localStorage.setItem('coraboSearchHistory', JSON.stringify(newHistory));
        } catch (error) {
          // Not critical
        }
        return newHistory;
      });
    }
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
  
  const value: Omit<AuthContextValue, 'updateUser' | 'updateUserProfileImage' | 'deleteUser' | 'toggleUserPause' | 'addContact'> = {
    // Auth
    firebaseUser, currentUser, isLoadingAuth, logout, setCurrentUser,
    // Data
    contacts, isContact, removeContact, users, transactions, setTransactions, allPublications, setAllPublications, cart, activeCartForCheckout, setActiveCartForCheckout, tempRecipientInfo, setTempRecipientInfo, deliveryAddress, setDeliveryAddress, setDeliveryAddressToCurrent, currentUserLocation, getCurrentLocation, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, searchHistory, clearSearchHistory, addSearchToHistory, notifications, conversations, qrSession,
    // Metric getters
    getUserMetrics, getAgendaEvents,
  };

  return (
    <AuthContext.Provider value={value as AuthContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
