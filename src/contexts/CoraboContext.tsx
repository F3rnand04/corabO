
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, CartItem, Transaction, GalleryImage, Conversation, TempRecipientInfo } from '@/lib/types';
import { getFirestoreDb }from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

// This context is now simplified to focus on providing real-time data.
// Business logic and derived state are moved to components with useMemo.
interface CoraboContextValue {
  currentUser: User | null;
  isLoadingUser: boolean; 
  
  users: User[];
  transactions: Transaction[];
  conversations: Conversation[];
  allPublications: GalleryImage[];
  searchHistory: string[];
  
  searchQuery: string;
  categoryFilter: string | null;
  
  deliveryAddress: string;
  currentUserLocation: GeolocationCoordinates | null;
  tempRecipientInfo: TempRecipientInfo | null;
  activeCartForCheckout: CartItem[] | null;
  cart: CartItem[];
  qrSession: any; // Kept for real-time QR session updates

  isContact: (contactId: string) => boolean;
  addContact: (contact: User) => void;
  removeContact: (contactId: string) => void;
  setSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  setCategoryFilter: (category: string | null) => void;
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  setCurrentUser: (user: User | null) => void;
  getUserMetrics: (userId: string) => { reputation: number; effectiveness: number; };
  getAgendaEvents: (transactions: Transaction[]) => any[];
}

export const CoraboContext = createContext<CoraboContextValue | undefined>(undefined);

interface CoraboProviderProps {
    children: ReactNode;
    initialCoraboUser: User | null;
}

export const CoraboProvider = ({ children, initialCoraboUser }: CoraboProviderProps) => {
  const { firebaseUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  
  // Raw data states from Firestore
  const [currentUser, setCurrentUser] = useState<User | null>(initialCoraboUser);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPublications, setAllPublications] = useState<GalleryImage[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // UI and Search states
  const [searchQuery, setSearchQueryState] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Local client state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [currentUserLocation, setCurrentUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [tempRecipientInfo, setTempRecipientInfo] = useState<TempRecipientInfo | null>(null);
  const [activeCartForCheckout, setActiveCartForCheckout] = useState<CartItem[] | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [qrSession, setQrSession] = useState<any>(null);
  
  // --- Effects for Data Fetching ---

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('coraboSearchHistory');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    }
  }, []);

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    if (query.trim()) {
      const newHistory = [query.trim(), ...searchHistory.filter(h => h !== query.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('coraboSearchHistory', JSON.stringify(newHistory));
    }
  }

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('coraboSearchHistory');
  }

  useEffect(() => {
    // This effect now correctly handles loading states and data fetching.
    setIsLoadingUser(isLoadingAuth);
    
    if (isLoadingAuth) {
        // While auth is loading, we keep the user data loading as well.
        // We also clear previous user data to prevent flashes of old content.
        setCurrentUser(null);
        setConversations([]);
        setTransactions([]);
        setContacts([]);
        setAllPublications([]);
        return;
    }
    
    const db = getFirestoreDb();
    let unsubs: (() => void)[] = [];

    // Global listeners - always active
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
    });
    unsubs.push(usersUnsub);

    const pubsUnsub = onSnapshot(collection(db, 'publications'), (snapshot) => {
        setAllPublications(snapshot.docs.map(doc => doc.data() as GalleryImage));
    });
    unsubs.push(pubsUnsub);

    if (firebaseUser) {
        // --- User-specific listeners, only attach if a user is logged in ---
        const userUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            const userData = docSnap.exists() ? docSnap.data() as User : null;
            setCurrentUser(userData);
            if (userData) {
              setContacts(userData.contacts || []);
            }
            setIsLoadingUser(false);
        });
        unsubs.push(userUnsub);

        const convosQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', firebaseUser.uid));
        const convosUnsub = onSnapshot(convosQuery, (snapshot) => {
            setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
        });
        unsubs.push(convosUnsub);

        const transQuery = query(collection(db, 'transactions'), where('participantIds', 'array-contains', firebaseUser.uid));
        const transUnsub = onSnapshot(transQuery, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
        });
        unsubs.push(transUnsub);

    } else {
        // No user, ensure all user-specific data is cleared and loading is false
        setCurrentUser(null);
        setConversations([]);
        setTransactions([]);
        setContacts([]);
        setIsLoadingUser(false);
    }

    return () => {
        unsubs.forEach(unsub => unsub());
    };

  }, [firebaseUser, isLoadingAuth]);

  // --- Derived State (Cart) ---
  const cart = useMemo((): CartItem[] => {
      if (!currentUser?.id) return [];
      return transactions
        .filter(tx => tx.clientId === currentUser.id && tx.status === 'Carrito Activo')
        .flatMap(tx => tx.details.items || []);
  }, [transactions, currentUser?.id]);


  // --- Client-side Actions ---
  
  const isContact = useCallback((contactId: string) => {
      return contacts.some(c => c.id === contactId);
  }, [contacts]);

  const addContact = useCallback(async (contact: User) => {
      if (!currentUser) return;
      const newContacts = [...contacts, contact];
      setContacts(newContacts);
      await updateDoc(doc(getFirestoreDb(), 'users', currentUser.id), { contacts: newContacts });
      toast({ title: "Contacto añadido", description: `${contact.name} ha sido añadido a tu lista.` });
  }, [currentUser, contacts, toast]);
  
  const removeContact = useCallback(async (contactId: string) => {
     if (!currentUser) return;
     const newContacts = contacts.filter(c => c.id !== contactId);
     setContacts(newContacts);
     await updateDoc(doc(getFirestoreDb(), 'users', currentUser.id), { contacts: newContacts });
     toast({ title: "Contacto eliminado" });
  }, [currentUser, contacts, toast]);


  const setDeliveryAddressToCurrent = useCallback(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentUserLocation(position.coords);
                // In a real app, you would use a geocoding service here.
                const address = `Lat: ${position.coords.latitude.toFixed(4)}, Lon: ${position.coords.longitude.toFixed(4)}`;
                setDeliveryAddress(address);
                toast({
                    title: "Ubicación Actualizada",
                    description: "Se está usando tu ubicación GPS actual.",
                });
            },
            (error) => {
                toast({
                    variant: "destructive",
                    title: "Error de Geolocalización",
                    description: "No se pudo obtener tu ubicación. Asegúrate de tener los permisos activados.",
                });
            }
        );
    } else {
        toast({
            variant: "destructive",
            title: "Navegador no compatible",
            description: "Tu navegador no soporta geolocalización.",
        });
    }
  }, [toast]);
  
  const getUserMetrics = useCallback((userId: string) => {
      const userTransactions = transactions.filter(tx => tx.providerId === userId || tx.clientId === userId);
      const ratedTransactions = userTransactions.filter(tx => tx.providerId === userId && tx.details.clientRating);
      const totalRating = ratedTransactions.reduce((acc, tx) => acc + (tx.details.clientRating || 0), 0);
      const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

      const relevantTransactions = userTransactions.filter(tx => tx.type !== 'Sistema' && tx.status !== 'Carrito Activo');
      const successfulTransactions = relevantTransactions.filter(tx => tx.status === 'Pagado' || tx.status === 'Resuelto');
      const effectiveness = relevantTransactions.length > 0 ? (successfulTransactions.length / relevantTransactions.length) * 100 : 100;

      return { reputation, effectiveness };
  }, [transactions]);
  
  const getAgendaEvents = useCallback((transactions: Transaction[]) => {
      return transactions
        .filter(tx => ['Finalizado - Pendiente de Pago', 'Cita Solicitada'].includes(tx.status))
        .map(tx => ({
            date: new Date(tx.date),
            type: tx.status === 'Finalizado - Pendiente de Pago' ? 'payment' : 'appointment',
            transactionId: tx.id,
        }));
  }, []);

  
  // --- Context Value ---
  const value: CoraboContextValue = {
    currentUser, isLoadingUser,
    users, transactions, conversations, allPublications, searchHistory,
    searchQuery, categoryFilter,
    deliveryAddress, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    cart, qrSession,
    
    isContact, addContact, removeContact,
    setSearchQuery, clearSearchHistory,
    setCategoryFilter,
    setDeliveryAddress,
    setDeliveryAddressToCurrent,
    setTempRecipientInfo,
    setActiveCartForCheckout,
    setCurrentUser,
    getUserMetrics,
    getAgendaEvents
  };
  
  return (
    <CoraboContext.Provider value={value}>
      {children}
    </CoraboContext.Provider>
  );
};

export const useCorabo = () => {
    const context = useContext(CoraboContext);
    if (context === undefined) {
        throw new Error('useCorabo must be used within a CoraboProvider');
    }
    return context;
};
