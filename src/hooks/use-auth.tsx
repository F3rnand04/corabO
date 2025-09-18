
'use client';

import { createContext, useContext } from 'react';
import type { User, Transaction, GalleryImage, CartItem, Product, TempRecipientInfo, QrSession, Notification, Conversation } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
