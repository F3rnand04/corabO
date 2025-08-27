
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
  setCategoryFilter: (category: string | null) => void;
  setDeliveryAddress: (address: string) => void;
  setDeliveryAddressToCurrent: () => void;
  setTempRecipientInfo: (info: TempRecipientInfo | null) => void;
  setActiveCartForCheckout: (cartItems: CartItem[] | null) => void;
  setCurrentUser: (user: User | null) => void;
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
  
  // UI and Search states
  const [searchQuery, setSearchQuery] = useState('');
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentUserLocation(position.coords),
        (error) => {
            // Geolocation is blocked by permissions policy in the dev environment.
            // This is expected, so we don't log an error to the console.
        }
      );
    }
  }, []);

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
        return;
    }
    
    const db = getFirestoreDb();
    let unsubs: (() => void)[] = [];

    // Global listener for all users, always active
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
    });
    unsubs.push(usersUnsub);

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
    if (currentUserLocation) {
        // In a real app, you would use a geocoding service here.
        const address = `Lat: ${currentUserLocation.latitude.toFixed(4)}, Lon: ${currentUserLocation.longitude.toFixed(4)}`;
        setDeliveryAddress(address);
    } else {
        toast({
            variant: "destructive",
            title: "Ubicación no disponible",
            description: "Activa el GPS o los servicios de ubicación de tu dispositivo.",
        });
    }
  }, [currentUserLocation, toast]);
  
  
  // --- Context Value ---
  const value: CoraboContextValue = {
    currentUser, isLoadingUser,
    users, transactions, conversations,
    searchQuery, categoryFilter,
    deliveryAddress, currentUserLocation, tempRecipientInfo, activeCartForCheckout,
    cart, qrSession,
    
    isContact, addContact, removeContact,
    setSearchQuery,
    setCategoryFilter,
    setDeliveryAddress,
    setDeliveryAddressToCurrent,
    setTempRecipientInfo,
    setActiveCartForCheckout,
    setCurrentUser,
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
