
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AppointmentRequest, AgreementProposal } from '@/lib/types';
import { users as initialUsers, products, services as initialServices, initialTransactions, initialConversations } from '@/lib/mock-data';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add } from 'date-fns';

type FeedView = 'servicios' | 'empresas';

interface DailyQuote {
    requestSignature: string;
    count: number;
}

interface CoraboState {
  currentUser: User;
  users: User[];
  products: Product[];
  services: Service[];
  cart: CartItem[];
  transactions: Transaction[];
  conversations: Conversation[];
  searchQuery: string;
  contacts: User[];
  feedView: FeedView;
  isGpsActive: boolean;
  switchUser: (userId: string) => void;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  getDeliveryCost: () => number;
  requestService: (service: Service) => void;
  requestQuoteFromGroup: (serviceName: string, items: string[], groupOrProvider: string) => boolean;
  sendQuote: (transactionId: string, quote: { breakdown: string; total: number }) => void;
  acceptQuote: (transactionId: string) => void;
  acceptAppointment: (transactionId: string) => void;
  payCommitment: (transactionId: string, rating?: number, comment?: string) => void;
  confirmPaymentReceived: (transactionId: string) => void;
  completeWork: (transactionId: string) => void;
  confirmWorkReceived: (transactionId: string, rating: number, comment?: string) => void;
  startDispute: (transactionId: string) => void;
  checkout: (transactionId: string, withDelivery: boolean, useCredicora: boolean) => void;
  setSearchQuery: (query: string) => void;
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;
  toggleGps: (userId: string) => void;
  updateUserProfileImage: (userId: string, imageUrl: string) => void;
  updateUserProfileAndGallery: (userId: string, newGalleryImage: GalleryImage) => void;
  removeGalleryImage: (userId: string, imageId: string) => void;
  validateEmail: (userId: string) => void;
  validatePhone: (userId: string) => void;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData) => void;
  subscribeUser: (userId: string) => void;
  activateTransactions: (userId: string, creditLimit: number) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: () => void;
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => string;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: AppointmentRequest) => void;
  getAgendaEvents: () => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [currentUser, setCurrentUser] = useState<User>(users.find(u => u.id === 'client1')!);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [feedView, setFeedView] = useState<FeedView>('servicios');
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [dailyQuotes, setDailyQuotes] = useState<Record<string, DailyQuote[]>>({});

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
    
    const provider = users.find(u => u.id === product.providerId);
    if (!provider) return; // Should not happen

    // If cart is not empty and new product is from a different provider
    if (cart.length > 0 && cartTx.providerId && cartTx.providerId !== product.providerId) {
        toast({
            variant: "destructive",
            title: "Carrito Multi-empresa",
            description: "No puedes añadir productos de diferentes empresas en el mismo carrito. Finaliza esta compra primero."
        });
        return;
    }

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
            providerId: newCart.length > 0 ? tx.providerId : '',
        }))

        return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    updateCartQuantity(productId, 0);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  
  const getDeliveryCost = () => {
    const distanceInKm = Math.floor(Math.random() * 10) + 1;
    return distanceInKm * 1.5; 
  }

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const generatePaymentCommitments = (originalTx: Transaction) => {
      if (!originalTx.details.initialPayment || !originalTx.providerId) return;
      
      const totalAmount = originalTx.details.totalAmount || originalTx.amount;
      const remainingAmount = totalAmount - originalTx.details.initialPayment;
      const numberOfInstallments = 3; // For Level 1
      const installmentAmount = remainingAmount / numberOfInstallments;
      
      const commitments: Transaction[] = [];

      for (let i = 1; i <= numberOfInstallments; i++) {
        const commitment: Transaction = {
          id: `commitment-${originalTx.id}-${i}`,
          type: 'Sistema',
          status: 'Acuerdo Aceptado - Pendiente de Ejecución',
          date: add(new Date(), { days: i * 15 }).toISOString(),
          amount: installmentAmount,
          clientId: originalTx.clientId,
          providerId: originalTx.providerId,
          details: {
            system: `Cuota ${i}/${numberOfInstallments} de compra ${originalTx.details.serviceName}`,
          },
        };
        commitments.push(commitment);
      }

      const commissionAmount = totalAmount * 0.05;
      const commissionTx: Transaction = {
        id: `commission-${originalTx.id}`,
        type: 'Sistema',
        status: 'Acuerdo Aceptado - Pendiente de Ejecución',
        date: add(new Date(), { days: 1 }).toISOString(),
        amount: commissionAmount,
        clientId: originalTx.providerId, // The provider owes the commission
        details: {
          system: `Comisión (5%) por venta Credicora #${originalTx.id}`
        }
      };

      setTransactions(prev => [...prev, ...commitments, commissionTx]);
  };


  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
    const cartTx = transactions.find(tx => tx.id === transactionId);
    if (!cartTx) return;

    const deliveryCost = withDelivery ? getDeliveryCost() : 0;
    const finalAmount = cartTx.amount + deliveryCost;

    const paymentMethod = useCredicora ? 'credicora' : 'direct';
    const initialPayment = useCredicora ? finalAmount * 0.60 : finalAmount;

    updateTransaction(cartTx.id, (tx) => {
        const newTx: Partial<Transaction> = {
            status: 'Finalizado - Pendiente de Pago',
            amount: initialPayment,
            details: { 
                ...tx.details, 
                delivery: withDelivery, 
                deliveryCost,
                paymentMethod,
                initialPayment: initialPayment,
                totalAmount: finalAmount, 
            },
            date: new Date().toISOString(),
        };
        return newTx;
    });

    setCart([]);
    toast({ title: "Acuerdo de Pago Creado", description: "El compromiso de pago ha sido registrado. Puedes verlo en tu sección de transacciones." });
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
  
  const requestQuoteFromGroup = (serviceName: string, items: string[], groupOrProvider: string): boolean => {
     const itemSignature = [...items, serviceName].sort().join('|');
     
     if (!currentUser.isSubscribed) {
         const today = new Date().toISOString().split('T')[0];
         const userQuotesToday = dailyQuotes[currentUser.id] || [];
         
         const requestsForSameItemToDifferentProviders = userQuotesToday.filter(
             q => q.requestSignature.startsWith(itemSignature)
         );
         
         const uniqueProvidersContacted = new Set(
             requestsForSameItemToDifferentProviders.map(q => q.requestSignature.split('|').pop())
         );

         if (uniqueProvidersContacted.size >= 3 && !uniqueProvidersContacted.has(groupOrProvider)) {
             return false; // Block request to a 4th provider for the same item.
         }

         const newSignature = `${itemSignature}|${groupOrProvider}`;
         const existingEntryIndex = userQuotesToday.findIndex(q => q.requestSignature === newSignature);
         
         if (existingEntryIndex > -1) {
            // Already requested from this provider today, let it pass
         } else {
             userQuotesToday.push({ requestSignature: newSignature, count: 1 });
         }
         setDailyQuotes({ ...dailyQuotes, [currentUser.id]: userQuotesToday });
     }


     // For demo, we'll just send it to the first provider found
     const provider = users.find(u => u.type === 'provider');
     if (!provider) {
        toast({ variant: 'destructive', title: "Error", description: "No se encontraron proveedores para enviar la cotización." });
        return false;
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
     return true;
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
        status: 'Acuerdo Aceptado - Pendiente de Ejecución',
        date: new Date().toISOString(),
    });
    toast({ title: "Acuerdo Aceptado", description: "El servicio ha comenzado." });
  };

  const acceptAppointment = (transactionId: string) => {
    updateTransaction(transactionId, {
      status: 'Acuerdo Aceptado - Pendiente de Ejecución',
      date: new Date().toISOString(),
    });
    toast({ title: "Cita Confirmada", description: "Se ha creado un compromiso de pago para el cliente." });
  }

  const completeWork = (transactionId: string) => {
    updateTransaction(transactionId, { status: 'Pendiente de Confirmación del Cliente' });
    toast({ title: "Trabajo Marcado como Finalizado", description: "Se ha notificado al cliente para que confirme la recepción." });
  };

  const confirmWorkReceived = (transactionId: string, rating: number, comment?: string) => {
    updateTransaction(transactionId, tx => ({
      status: 'Finalizado - Pendiente de Pago',
      details: {
        ...tx.details,
        clientRating: rating,
        clientComment: comment,
      }
    }));
    toast({ title: "Trabajo Confirmado", description: "Gracias por tu feedback. Ahora puedes proceder con el pago." });
  };
  
  const payCommitment = (transactionId: string, rating?: number, comment?: string) => {
    updateTransaction(transactionId, tx => ({
      status: 'Pago Enviado - Esperando Confirmación',
      date: new Date().toISOString(),
      details: {
        ...tx.details,
        clientRating: rating,
        clientComment: comment,
      }
    }));
    toast({ title: "¡Pago Registrado!", description: "Se ha notificado al proveedor para que confirme la recepción." });
  };

  const confirmPaymentReceived = (transactionId: string) => {
    const originalTx = transactions.find(tx => tx.id === transactionId);
    if (!originalTx) return;

    updateTransaction(transactionId, { status: 'Pagado' });

    // Activate Credicora plan only after initial payment is confirmed
    if (originalTx.details.paymentMethod === 'credicora' && originalTx.details.initialPayment) {
        generatePaymentCommitments(originalTx);
    }

    toast({ title: "¡Pago Confirmado!", description: "Gracias por tu pago. ¡Has sumado puntos a tu reputación!" });
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
  
  const updateUser = (userId: string, updates: Partial<User> | ((user: User) => Partial<User>)) => {
    setUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === userId) {
          const userToUpdate = users.find(u => u.id === userId)!;
          const finalUpdates = typeof updates === 'function' ? updates(userToUpdate) : updates;
          const updatedUser = { ...u, ...finalUpdates };
          
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      })
    );
  };

  const toggleGps = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if(user){
      updateUser(userId, { isGpsActive: !user.isGpsActive });
      if (userId === currentUser.id) {
          if (!user.isGpsActive) {
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
      }
    }
  };

  const updateUserProfileImage = (userId: string, imageUrl: string) => {
    updateUser(userId, { profileImage: imageUrl });
  };
  
  const updateUserProfileAndGallery = (userId: string, newGalleryImage: GalleryImage) => {
    updateUser(userId, (user) => ({
        gallery: [{...newGalleryImage, id: newGalleryImage.src}, ...(user.gallery || [])]
    }));
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
    const newType = data.offerType === 'service' ? 'servicios' : 'empresas';
    updateUser(userId, user => ({
      ...user,
      type: data.categories?.length ? 'provider' : 'client',
      email: data.email || user.email,
      phone: data.phone || user.phone,
      profileSetupData: {
        ...(user.profileSetupData || {}),
        ...data,
      }
    }));
    setFeedView(newType);
    toast({
      title: "¡Perfil Actualizado!",
      description: "Recuerda que datos como tu nombre de usuario y tipo de perfil solo pueden cambiarse dos veces al año para mantener la confianza en la comunidad."
    });
  }

  const subscribeUser = (userId: string) => {
    updateUser(userId, { isSubscribed: true, verified: true });
    toast({
        title: "¡Suscripción Activada!",
        description: "Ahora eres un usuario verificado y tienes acceso a todos los beneficios."
    });
  }

  const activateTransactions = (userId: string, creditLimit: number) => {
    updateUser(userId, { isTransactionsActive: true, credicoraLimit: creditLimit });
    toast({
        title: "¡Módulo de Transacciones Activado!",
        description: "Ya puedes empezar a gestionar tus finanzas.",
        className: "bg-green-100 border-green-300 text-green-800",
    });
    router.push('/transactions');
  }
  
  const deactivateTransactions = (userId: string) => {
    updateUser(userId, { isTransactionsActive: false, credicoraLimit: 0 });
    toast({
        title: "Registro de Transacciones Desactivado",
        description: "Tu módulo ha sido desactivado. Puedes volver a activarlo desde los ajustes."
    });
  }

  const downloadTransactionsPDF = () => {
    const doc = new jsPDF();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const filteredTransactions = transactions.filter(tx => new Date(tx.date) >= threeMonthsAgo);

    if (filteredTransactions.length === 0) {
        toast({ title: "No hay transacciones", description: "No hay transacciones en los últimos 3 meses para imprimir." });
        return;
    }

    doc.setFontSize(18);
    doc.text(`Registro de Transacciones - ${currentUser.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Desde ${threeMonthsAgo.toLocaleDateString()} hasta ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Fecha", "Tipo", "Descripción", "Monto"];
    const tableRows: (string|number)[][] = [];

    filteredTransactions.forEach(tx => {
        const description = tx.type === 'Servicio' 
            ? tx.details.serviceName
            : tx.type === 'Compra' 
                ? tx.details.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ')
                : tx.details.system;

        const txData = [
            new Date(tx.date).toLocaleDateString(),
            tx.type,
            description || '',
            `$${tx.amount.toFixed(2)}`
        ];
        tableRows.push(txData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
    });

    doc.save(`transacciones_${currentUser.id}_${new Date().toISOString().split('T')[0]}.pdf`);
     toast({ title: "Descarga Iniciada", description: "Tu reporte de transacciones se está descargando." });
  }

  const sendMessage = (recipientId: string, text: string, createOnly: boolean = false): string => {
    let conversation = conversations.find(c => 
        c.participantIds.includes(currentUser.id) && c.participantIds.includes(recipientId)
    );

    if (!conversation) {
        conversation = {
            id: `convo-${Date.now()}`,
            participantIds: [currentUser.id, recipientId],
            messages: [],
        };
        setConversations(prev => [conversation!, ...prev]);
    }
    
    if (createOnly && !text) {
      return conversation.id;
    }

    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        text,
        timestamp: new Date().toISOString(),
        type: 'text',
    };

    setConversations(prevConvos => 
        prevConvos.map(convo => {
            if (convo.id === conversation!.id) {
                return {
                    ...convo,
                    messages: text ? [...convo.messages, newMessage] : convo.messages,
                    unreadCount: 0,
                };
            }
            return convo;
        })
    );
    
    return conversation.id;
  };
  
  const sendProposalMessage = (conversationId: string, proposal: AgreementProposal) => {
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
        type: 'proposal',
        proposal: proposal,
        isProposalAccepted: false,
    };
    setConversations(prevConvos => 
        prevConvos.map(convo => {
            if (convo.id === conversationId) {
                return { ...convo, messages: [...convo.messages, newMessage] };
            }
            return convo;
        })
    );
    toast({ title: "Propuesta Enviada", description: "Tu propuesta ha sido enviada al cliente."});
  };

  const acceptProposal = (conversationId: string, messageId: string) => {
    let transaction: Transaction | null = null;

    setConversations(prevConvos => 
        prevConvos.map(convo => {
            if (convo.id === conversationId) {
                const newMessages = convo.messages.map(msg => {
                    if (msg.id === messageId && msg.proposal) {
                        const providerId = msg.senderId;
                        const clientId = convo.participantIds.find(p => p !== providerId)!;

                        transaction = {
                            id: `txn-${Date.now()}`,
                            type: 'Servicio',
                            status: 'Acuerdo Aceptado - Pendiente de Ejecución',
                            date: msg.proposal.deliveryDate,
                            amount: msg.proposal.amount,
                            clientId: clientId,
                            providerId: providerId,
                            details: {
                                serviceName: msg.proposal.title,
                                proposal: msg.proposal
                            },
                        };

                        return { ...msg, isProposalAccepted: true };
                    }
                    return msg;
                });
                return { ...convo, messages: newMessages };
            }
            return convo;
        })
    );
    
    if (transaction) {
      setTransactions(prev => [transaction!, ...prev]);
      toast({ title: "Acuerdo Aceptado", description: "Se ha creado un nuevo compromiso de pago."});
    }
  };


  const createAppointmentRequest = (request: AppointmentRequest) => {
    const newTx: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'Servicio',
      status: 'Cita Solicitada',
      date: request.date.toISOString(),
      amount: request.amount,
      clientId: currentUser.id,
      providerId: request.providerId,
      details: {
        serviceName: request.details,
      },
    };
    setTransactions(prev => [newTx, ...prev]);
    toast({
        title: "¡Solicitud de Cita Enviada!",
        description: `Se ha notificado a tu proveedor. Recibirás una respuesta pronto.`
    })
  }

  const getAgendaEvents = () => {
    const events: { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[] = [];
    transactions.forEach(tx => {
        if (tx.status === 'Acuerdo Aceptado - Pendiente de Ejecución' || tx.status === 'Finalizado - Pendiente de Pago' || tx.status === 'Cita Solicitada') {
             const baseDescription = tx.type === 'Sistema' 
                ? tx.details.system || 'Compromiso de Pago'
                : tx.details.serviceName || tx.details.items?.map(i => i.product.name).join(', ') || 'Tarea Pendiente';
            
            const isPayment = tx.type === 'Sistema' || tx.status === 'Finalizado - Pendiente de Pago';

            let eventType: 'payment' | 'task' = 'task';
            let eventDescription = `Entrega: ${baseDescription}`;

            if(isPayment) {
              eventType = 'payment';
              eventDescription = `Por Pagar: ${baseDescription}`;
            } else if (tx.status === 'Cita Solicitada') {
              eventDescription = `Cita solicitada: ${baseDescription}`;
            }


            events.push({
                date: new Date(tx.date),
                type: eventType,
                description: eventDescription,
                transactionId: tx.id
            });
        }
    });
    return events;
  };


  const value = {
    currentUser,
    users,
    products,
    services,
    cart,
    transactions,
    conversations,
    searchQuery,
    contacts,
    feedView,
    isGpsActive,
    setFeedView,
    switchUser,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    getDeliveryCost,
    checkout,
    requestService,
    requestQuoteFromGroup,
    sendQuote,
    acceptQuote,
    acceptAppointment,
    completeWork,
    confirmWorkReceived,
    payCommitment,
    confirmPaymentReceived,
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
    activateTransactions,
    deactivateTransactions,
    downloadTransactionsPDF,
    sendMessage,
    sendProposalMessage,
    acceptProposal,
    createAppointmentRequest,
    getAgendaEvents,
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
export type { Transaction };

    