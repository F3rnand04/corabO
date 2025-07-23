"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus } from '@/lib/types';
import { users, products, services, initialTransactions } from '@/lib/mock-data';
import { useToast } from "@/hooks/use-toast"

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
  switchUser: (userId: string) => void;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  requestService: (service: Service) => void;
  sendQuote: (transactionId: string, quote: { breakdown: string; total: number }) => void;
  acceptQuote: (transactionId: string) => void;
  startDispute: (transactionId: string) => void;
  checkout: (withDelivery: boolean) => void;
  setSearchQuery: (query: string) => void;
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;
  toggleGps: () => void;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);

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
    if (currentUser.type !== 'client') {
        toast({ variant: 'destructive', title: "Acción no permitida", description: "Solo los clientes pueden solicitar servicios."});
        return;
    }
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
  
  const sendQuote = (transactionId: string, quote: { breakdown: string; total: number }) => {
     if (currentUser.type !== 'provider') {
        toast({ variant: 'destructive', title: "Acción no permitida", description: "Solo los prestadores pueden enviar cotizaciones."});
        return;
    }
    updateTransaction(transactionId, tx => ({
        status: 'Cotización Recibida',
        amount: quote.total,
        details: { ...tx.details, quote },
        date: new Date().toISOString(),
    }));
    toast({ title: "Cotización Enviada", description: "La cotización ha sido enviada al cliente." });
  };
  
  const acceptQuote = (transactionId: string) => {
    if (currentUser.type !== 'client') {
        toast({ variant: 'destructive', title: "Acción no permitida", description: "Solo los clientes pueden aceptar cotizaciones."});
        return;
    }
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
    setIsGpsActive(prev => !prev);
    toast({
        title: `GPS ${!isGpsActive ? 'Activado' : 'Desactivado'}`,
        description: `Ahora ${!isGpsActive ? 'eres visible' : 'no eres visible'} y puedes ver proveedores cercanos.`
    });
  };

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
    switchUser,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    checkout,
    requestService,
    sendQuote,
    acceptQuote,
    startDispute,
    setSearchQuery,
    addContact,
    removeContact,
    toggleGps,
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
