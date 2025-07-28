
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData } from '@/lib/types';
import { users as initialUsers, products, services as initialServices, initialTransactions } from '@/lib/mock-data';
import { useToast } from "@/hooks/use-toast"

type FeedView = 'servicios' | 'empresas';

interface CoraboState {
  currentUser: User;
  users: User[];
  products: Product[];
  services: Service[];
  cart: CartItem[];
  transactions: Transaction[];
  searchQuery: string;
  contacts: User[];
  isGpsActive: boolean;
  feedView: FeedView;
  switchUser: (userId: string) => void;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  requestService: (service: Service) => void;
  requestQuoteFromGroup: (serviceName: string, items: string[]) => void;
  sendQuote: (transactionId: string, quote: { breakdown: string; total: number }) => void;
  acceptQuote: (transactionId: string) => void;
  startDispute: (transactionId: string) => void;
  checkout: (withDelivery: boolean) => void;
  setSearchQuery: (query: string) => void;
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;
  toggleGps: () => void;
  updateUserProfileImage: (userId: string, imageUrl: string) => void;
  updateUserProfileAndGallery: (userId: string, newGalleryImage: GalleryImage) => void;
  removeGalleryImage: (userId: string, imageId: string) => void;
  validateEmail: (userId: string) => void;
  validatePhone: (userId: string) => void;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData) => void;
  subscribeUser: (userId: string) => void;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [feedView, setFeedView] = useState<FeedView>('servicios');

  const findOrCreateCartTransaction = (): Transaction => {
    const existingCartTx = transactions.find(
      (tx) => tx.clientId === currentUser.id && tx.status === 'Carrito Activo'
    );
    if (existingCartTx) {
      return existingCartTx;
    }
    const newCartTx: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'Compra',
      status: 'Carrito Activo',
      date: new Date().toISOString(),
      amount: 0,
      clientId: currentUser.id,
      providerId: '', // Will be set by first item
      details: {
        items: [],
        delivery: false,
        deliveryCost: 0,
      },
    };
    setTransactions((prev) => [...prev, newCartTx]);
    return newCartTx;
  };
  
  const updateTransaction = (txId: string, updates: Partial<Transaction> | ((tx: Transaction) => Partial<Transaction>)) => {
    setTransactions(prevTxs => prevTxs.map(tx => tx.id === txId ? { ...tx, ...(typeof updates === 'function' ? updates(tx) : updates) } : tx));
  };
  
  const addToCart = (product: Product, quantity: number) => {
    let cartTx = findOrCreateCartTransaction();

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newCart = [...prevCart, { product, quantity }];
      }

      updateTransaction(cartTx.id, (tx) => ({
        providerId: product.providerId,
        details: { ...tx.details, items: newCart },
        amount: newCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      }));

      return newCart;
    });

    toast({ title: "Producto añadido", description: `${product.name} fue añadido al carrito.` });
  };
  
  const updateCartQuantity = (productId: string, quantity: number) => {
    let cartTx = findOrCreateCartTransaction();

    setCart((prevCart) => {
        const newCart = prevCart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
        ).filter(item => item.quantity > 0);

        updateTransaction(cartTx.id, tx => ({
            details: { ...tx.details, items: newCart },
            amount: newCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        }))

        return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    updateCartQuantity(productId, 0);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const checkout = (withDelivery: boolean) => {
    const cartTx = transactions.find(tx => tx.clientId === currentUser.id && tx.status === 'Carrito Activo');
    if (!cartTx) return;
    
    const deliveryCost = withDelivery ? Math.round(Math.random() * 10 + 5) * 1.5 : 0;
    const finalAmount = cartTx.amount + deliveryCost;

    updateTransaction(cartTx.id, {
        status: 'Pagado',
        amount: finalAmount,
        details: { ...cartTx.details, delivery: withDelivery, deliveryCost },
        date: new Date().toISOString(),
    });

    setCart([]);
    toast({ title: "Compra realizada", description: "Tu pedido ha sido procesado con éxito." });
  }

  const requestService = (service: Service) => {
    const newTx: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'Servicio',
        status: 'Solicitud Pendiente',
        date: new Date().toISOString(),
        amount: 0,
        clientId: currentUser.id,
        providerId: service.providerId,
        details: {
            serviceName: service.name,
            delivery: false,
            deliveryCost: 0
        },
    };
    setTransactions(prev => [newTx, ...prev]);
    toast({ title: "Servicio Solicitado", description: `Has solicitado el servicio: ${service.name}` });
  };
  
  const requestQuoteFromGroup = (serviceName: string, items: string[]) => {
     // For demo, we'll just send it to the first provider found
     const provider = users.find(u => u.type === 'provider');
     if (!provider) {
        toast({ variant: 'destructive', title: "Error", description: "No se encontraron proveedores para enviar la cotización." });
        return;
     }

     const newTx: Transaction = {
         id: `txn-${Date.now()}`,
         type: 'Servicio',
         status: 'Solicitud Pendiente',
         date: new Date().toISOString(),
         amount: 0,
         clientId: currentUser.id,
         providerId: provider.id, // In a real app, this would be a group or multiple providers
         details: {
             serviceName: serviceName,
             quoteItems: items,
             delivery: false,
             deliveryCost: 0
         },
     };
     setTransactions(prev => [newTx, ...prev]);
  }

  const sendQuote = (transactionId: string, quote: { breakdown: string; total: number }) => {
    updateTransaction(transactionId, tx => ({
        status: 'Cotización Recibida',
        amount: quote.total,
        details: { ...tx.details, quote },
        date: new Date().toISOString(),
    }));
    toast({ title: "Cotización Enviada", description: "La cotización ha sido enviada al cliente." });
  };
  
  const acceptQuote = (transactionId: string) => {
    updateTransaction(transactionId, {
        status: 'Servicio en Curso',
        date: new Date().toISOString(),
    });
    toast({ title: "Acuerdo Aceptado", description: "El servicio ha comenzado." });
  };
  
  const startDispute = (transactionId: string) => {
    updateTransaction(transactionId, { status: 'En Disputa' });
    toast({ variant: 'destructive', title: "Disputa Iniciada", description: "La transacción está ahora en disputa." });
  };

  const addContact = (user: User) => {
    setContacts(prev => {
        if (prev.find(c => c.id === user.id)) {
            toast({ variant: "default", title: "Contacto ya existe", description: `${user.name} ya está en tus contactos.` });
            return prev;
        }
        toast({ title: "Contacto añadido", description: `${user.name} fue añadido a tus contactos.` });
        return [...prev, user];
    });
  };

  const removeContact = (userId: string) => {
    setContacts(prev => prev.filter(c => c.id !== userId));
    toast({ variant: "destructive", title: "Contacto eliminado", description: "El contacto ha sido eliminado." });
  };

  const toggleGps = () => {
    const willBeActive = !isGpsActive;
    setIsGpsActive(willBeActive);
    
    if (willBeActive) {
      toast({
        title: "GPS Activado",
        description: "Ahora eres visible según la ubicación de tu perfil.",
      });
    } else {
       toast({
        title: "GPS Desactivado",
        description: "Has dejado de ser visible para otros usuarios.",
      });
    }
  };
  
  const updateUser = (userId: string, updates: Partial<User> | ((user: User) => Partial<User>)) => {
    let updatedUser: User | undefined;
    const userToUpdate = users.find(u => u.id === userId)
    if (!userToUpdate) return;

    const finalUpdates = typeof updates === 'function' ? updates(userToUpdate) : updates;

    setUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === userId) {
          updatedUser = { ...u, ...finalUpdates };
          return updatedUser;
        }
        return u;
      })
    );
    if (currentUser.id === userId && updatedUser) {
      setCurrentUser(updatedUser);
    }
    return updatedUser;
  };

  const updateUserProfileImage = (userId: string, imageUrl: string) => {
    updateUser(userId, { profileImage: imageUrl });
  };
  
  const updateUserProfileAndGallery = (userId: string, newGalleryImage: GalleryImage) => {
    updateUser(userId, (user) => ({
        gallery: [{...newGalleryImage, id: newGalleryImage.src}, ...(user.gallery || [])]
    }));
    toast({
      title: "¡Publicación Exitosa!",
      description: "Tu nueva imagen ya está en tu vitrina y tu perfil ha sido actualizado.",
    });
  };
  
  const removeGalleryImage = (userId: string, imageId: string) => {
    updateUser(userId, (user) => ({
        gallery: user.gallery?.filter(image => image.id !== imageId) || []
    }));

    toast({
        title: "Publicación Eliminada",
        description: "La imagen ha sido eliminada de tu galería."
    });
  };

  const validateEmail = (userId: string) => {
    updateUser(userId, { emailValidated: true });
  }

  const validatePhone = (userId: string) => {
     updateUser(userId, { phoneValidated: true });
  }

  const updateFullProfile = (userId: string, data: ProfileSetupData) => {
     updateUser(userId, user => ({
      ...user,
      type: data.categories?.length ? 'provider' : 'client',
      email: data.email || user.email,
      phone: data.phone || user.phone,
      profileSetupData: {
        ...(user.profileSetupData || {}),
        ...data,
      }
     }))
  }

  const subscribeUser = (userId: string) => {
    updateUser(userId, { isSubscribed: true, verified: true });
    toast({
        title: "¡Suscripción Activada!",
        description: "Ahora eres un usuario verificado y tienes acceso a todos los beneficios."
    });
  }

  const value = {
    currentUser,
    users,
    products,
    services,
    cart,
    transactions,
    searchQuery,
    contacts,
    isGpsActive,
    feedView,
    setFeedView,
    switchUser,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    checkout,
    requestService,
    requestQuoteFromGroup,
    sendQuote,
    acceptQuote,
    startDispute,
    setSearchQuery,
    addContact,
    removeContact,
    toggleGps,
    updateUserProfileImage,
    updateUserProfileAndGallery,
    removeGalleryImage,
    validateEmail,
    validatePhone,
    updateFullProfile,
    subscribeUser,
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
