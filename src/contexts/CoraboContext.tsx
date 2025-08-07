
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Product, Service, CartItem, Transaction, TransactionStatus, GalleryImage, ProfileSetupData, Conversation, Message, AppointmentRequest, AgreementProposal, CredicoraLevel } from '@/lib/types';
import { users as initialUsers, products as initialProducts, services as initialServices, initialTransactions, initialConversations } from '@/lib/mock-data';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add, subDays, startOfDay } from 'date-fns';
import { credicoraLevels } from '@/lib/types';

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
  addProduct: (product: Product) => void;
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
  confirmPaymentReceived: (transactionId: string, fromThirdParty: boolean) => void;
  completeWork: (transactionId: string) => void;
  confirmWorkReceived: (transactionId: string, rating: number, comment?: string) => void;
  startDispute: (transactionId: string) => void;
  checkout: (transactionId: string, withDelivery: boolean, useCredicora: boolean) => void;
  setSearchQuery: (query: string) => void;
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;
  toggleGps: (userId: string) => void;
  updateUserProfileImage: (userId: string, imageUrl: string) => void;
  updateUserProfileAndGallery: (userId: string, imageOrId: GalleryImage | string, isDelete?: boolean) => void;
  removeGalleryImage: (userId: string, imageId: string) => void;
  validateEmail: (userId: string) => void;
  validatePhone: (userId: string) => void;
  setFeedView: (view: FeedView) => void;
  updateFullProfile: (userId: string, data: ProfileSetupData) => void;
  subscribeUser: (userId: string, planName: string, amount: number) => void;
  activateTransactions: (userId: string, creditLimit: number) => void;
  deactivateTransactions: (userId: string) => void;
  downloadTransactionsPDF: () => void;
  sendMessage: (recipientId: string, text: string, createOnly?: boolean) => string;
  sendProposalMessage: (conversationId: string, proposal: AgreementProposal) => void;
  acceptProposal: (conversationId: string, messageId: string) => void;
  createAppointmentRequest: (request: AppointmentRequest) => void;
  getAgendaEvents: () => { date: Date; type: 'payment' | 'task'; description: string, transactionId: string }[];
  addCommentToImage: (ownerId: string, imageId: string, commentText: string) => void;
  removeCommentFromImage: (ownerId: string, imageId: string, commentIndex: number) => void;
  getCartItemQuantity: (productId: string) => number;
  checkIfShouldBeEnterprise: (providerId: string) => boolean;
  activatePromotion: (details: { imageId: string, promotionText: string, cost: number }) => void;
  createCampaign: (campaignDetails: any) => void;
}

const CoraboContext = createContext<CoraboState | undefined>(undefined);

export const CoraboProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
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

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };
  
  const addToCart = (product: Product, quantity: number) => {
    if (!currentUser.isTransactionsActive) {
        toast({ variant: 'destructive', title: "Acción Requerida", description: "Debes activar tu registro de transacciones para poder comprar." });
        return;
    }
    let cartTx = findOrCreateCartTransaction();
    
    const provider = users.find(u => u.id === product.providerId);
    if (!provider || !provider.isTransactionsActive) {
      toast({ variant: 'destructive', title: "Proveedor no disponible", description: "Este proveedor no tiene activas las transacciones en este momento."});
      return;
    }

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
  };
  
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (!currentUser.isTransactionsActive) {
        toast({ variant: 'destructive', title: "Acción Requerida", description: "Debes activar tu registro de transacciones para poder comprar." });
        return;
    }
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

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const removeFromCart = (productId: string) => {
    updateCartQuantity(productId, 0);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  
  const getDeliveryCost = () => {
    const distanceInKm = Math.floor(Math.random() * 5) + 1; // Simulate 1 to 5 km
    return distanceInKm * 1.5; 
  }

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const generatePaymentCommitments = (originalTx: Transaction) => {
      if (!originalTx.providerId) return;

      const client = users.find(u => u.id === originalTx.clientId);
      if(!client) return;

      const userLevel = client.credicoraLevel || 1;
      const levelDetails = credicoraLevels[userLevel.toString()];

      if (!levelDetails || !originalTx.details.financedAmount) return;
      
      const financedAmount = originalTx.details.financedAmount;
      const numberOfInstallments = levelDetails.installments;
      const installmentAmount = financedAmount / numberOfInstallments;
      
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

      const commissionAmount = originalTx.amount * 0.0499; // 4.99% commission on the total value of products
      const commissionTx: Transaction = {
        id: `commission-${originalTx.id}`,
        type: 'Sistema',
        status: 'Acuerdo Aceptado - Pendiente de Ejecución',
        date: add(new Date(), { days: 1 }).toISOString(),
        amount: commissionAmount,
        clientId: originalTx.providerId, // The provider owes the commission
        providerId: 'corabo-app', // Commission is owed to the app
        details: {
          system: `Comisión (4.99%) por venta Credicora #${originalTx.id}`
        }
      };

      setTransactions(prev => [...prev, ...commitments, commissionTx]);
  };

  const assignDelivery = (mainTransactionId: string) => {
    const mainTx = transactions.find(tx => tx.id === mainTransactionId);
    if (!mainTx || !mainTx.details.delivery) return;

    // Simulate finding the nearest delivery provider
    const deliveryProvider = users.find(u => u.profileSetupData?.primaryCategory === 'Fletes y Delivery');

    if (!deliveryProvider) {
        toast({ variant: "destructive", title: "Sin Repartidores", description: "No hay repartidores disponibles en este momento. Intenta más tarde." });
        return;
    }

    const deliveryTx: Transaction = {
        id: `delivery-tx-${mainTx.id}`,
        type: 'Delivery',
        status: 'Acuerdo Aceptado - Pendiente de Ejecución',
        date: new Date().toISOString(),
        amount: mainTx.details.deliveryCost || 0,
        clientId: mainTx.providerId!, // The seller pays the delivery guy
        providerId: deliveryProvider.id,
        details: {
            serviceName: `Entrega para Pedido #${mainTx.id}`,
            originAddress: 'Dirección del Vendedor (simulada)',
            destinationAddress: 'Dirección del Cliente (simulada)',
        }
    };

    setTransactions(prev => [...prev, deliveryTx]);
    updateTransaction(mainTransactionId, { 
        status: 'En Reparto',
        details: { ...mainTx.details, deliveryProviderId: deliveryProvider.id }
    });

    toast({ title: "¡En Camino!", description: `El repartidor ${deliveryProvider.name} va en camino a retirar tu pedido.` });
  };


  const checkout = (transactionId: string, withDelivery: boolean, useCredicora: boolean) => {
    const cartTx = transactions.find(tx => tx.id === transactionId);
    if (!cartTx) return;

    const deliveryCost = withDelivery ? getDeliveryCost() : 0;
    const subtotal = cartTx.amount;
    
    let finalTx: Transaction | undefined;
    
    if (useCredicora) {
        const userLevel = currentUser.credicoraLevel || 1;
        const levelDetails = credicoraLevels[userLevel.toString()];
        const creditLimit = currentUser.credicoraLimit || 0;
        
        const financingPercentage = 1 - levelDetails.initialPaymentPercentage;
        const potentialFinancing = subtotal * financingPercentage; // Finance only on subtotal
        const financedAmount = Math.min(potentialFinancing, creditLimit);
        
        const initialPayment = (subtotal - financedAmount) + deliveryCost; // Initial payment includes full delivery cost

        updateTransaction(cartTx.id, tx => {
            const newTxDetails: Partial<Transaction> = {
                status: 'Finalizado - Pendiente de Pago',
                amount: initialPayment,
                details: {
                    ...tx.details,
                    delivery: withDelivery,
                    deliveryCost,
                    paymentMethod: 'credicora',
                    initialPayment: initialPayment,
                    totalAmount: subtotal + deliveryCost,
                    financedAmount: financedAmount,
                },
                date: new Date().toISOString(),
            };
            finalTx = { ...tx, ...newTxDetails };
            return newTxDetails;
        });

    } else { // Direct Payment
        updateTransaction(cartTx.id, tx => {
            const newTxDetails: Partial<Transaction> = {
                status: 'Finalizado - Pendiente de Pago',
                amount: subtotal + deliveryCost,
                details: {
                    ...tx.details,
                    delivery: withDelivery,
                    deliveryCost,
                    paymentMethod: 'direct',
                    initialPayment: subtotal + deliveryCost,
                    totalAmount: subtotal + deliveryCost,
                },
                date: new Date().toISOString(),
            };
            finalTx = { ...tx, ...newTxDetails };
            return newTxDetails;
        });
    }

    setCart([]);
    // toast({ title: "Acuerdo de Pago Creado", description: "El compromiso de pago ha sido registrado. Serás redirigido para completar el pago." });
    
    if (finalTx) {
        router.push(`/quotes/payment?commitmentId=${finalTx.id}&amount=${finalTx.amount}`);
    }
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
    const client = users.find(u => u.id === currentUser.id);
    const newStatus = client?.isSubscribed ? 'Acuerdo Aceptado - Pendiente de Ejecución' : 'Finalizado - Pendiente de Pago';
    const toastTitle = client?.isSubscribed ? "Acuerdo Aceptado" : "Acuerdo Aceptado - Pago Requerido";
    const toastDescription = client?.isSubscribed ? "El servicio ha comenzado." : "Debes realizar el pago por adelantado para continuar.";

    updateTransaction(transactionId, {
        status: newStatus,
        date: new Date().toISOString(),
    });

    toast({ title: toastTitle, description: toastDescription });
  };

  const acceptAppointment = (transactionId: string) => {
    const client = users.find(u => u.id === currentUser.id);
    const newStatus = client?.isSubscribed ? 'Acuerdo Aceptado - Pendiente de Ejecución' : 'Finalizado - Pendiente de Pago';
    const toastTitle = client?.isSubscribed ? "Cita Confirmada" : "Cita Confirmada - Pago Requerido";
    const toastDescription = client?.isSubscribed ? "Se ha creado un compromiso de pago para el cliente." : "El cliente debe pagar por adelantado para confirmar la cita.";

    updateTransaction(transactionId, {
      status: newStatus,
      date: new Date().toISOString(),
    });
    toast({ title: toastTitle, description: toastDescription });
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
    const originalTx = transactions.find(tx => tx.id === transactionId);

    updateTransaction(transactionId, tx => ({
      status: 'Pago Enviado - Esperando Confirmación',
      date: new Date().toISOString(),
      details: {
        ...tx.details,
        clientRating: rating,
        clientComment: comment,
      }
    }));

    if (originalTx?.details.system?.includes('Plan')) {
         toast({ title: "¡Pago de Suscripción Registrado!", description: "Se ha notificado al sistema. Tu verificación está en proceso." });
    } else {
        toast({ title: "¡Pago Registrado!", description: "Se ha notificado al proveedor para que confirme la recepción." });
    }
  };

  const confirmPaymentReceived = (transactionId: string, fromThirdParty: boolean) => {
    const originalTx = transactions.find(tx => tx.id === transactionId);
    if (!originalTx) return;

    updateTransaction(transactionId, tx => ({
        status: 'Pagado',
        details: {
            ...tx.details,
            paymentFromThirdParty: fromThirdParty
        }
    }));

    if (fromThirdParty) {
        toast({ variant: 'destructive', title: "Pago de Tercero Reportado", description: "La transacción ha sido marcada. Gracias por tu colaboración." });
    } else {
        toast({ title: "¡Pago Confirmado!", description: "Gracias por tu pago. ¡Has sumado puntos a tu reputación!" });
    }

    if (originalTx.details.delivery) {
        assignDelivery(transactionId);
    }
    
    if (originalTx.details.paymentMethod === 'credicora' && originalTx.details.initialPayment) {
        generatePaymentCommitments(originalTx);
    }

    // Activate subscription after payment is confirmed
    if(originalTx.details.system?.includes('Plan')) {
        const user = users.find(u => u.id === originalTx.clientId);
        if (!user) return;
        
        updateUser(originalTx.clientId, { isSubscribed: true, verified: false }); // Don't mark as verified yet

        const messageForProvider = "¡Felicidades por dar el siguiente paso! Hemos recibido tu pago y tu perfil ya está en proceso de revisión. Si todo está en orden, tu insignia de **Verificado** brillará en tu perfil en menos de 24 horas. ¡Prepárate para una lluvia de nuevas oportunidades, mayor visibilidad y la confianza que mereces! El éxito te espera.";
        const messageForClient = "¡Excelente decisión! Hemos recibido tu pago y tu perfil ya está en proceso de revisión. En menos de 24 horas, tu insignia de **Verificado** estará activa, dándote acceso a transacciones más seguras y a los proveedores más confiables de la plataforma. ¡Prepárate para una experiencia de compra con total tranquilidad y confianza!";

        sendMessage(
            originalTx.clientId, 
            user.type === 'provider' ? messageForProvider : messageForClient
        );
        toast({ title: "¡Verificación en Proceso!", description: "Revisa tus mensajes para ver los siguientes pasos."});
    }
  };

  const startDispute = (transactionId: string) => {
    updateTransaction(transactionId, { status: 'En Disputa' });
    toast({ variant: 'destructive', title: "Disputa Iniciada", description: "La transacción está ahora en disputa." });
  };

  const addContact = (user: User) => {
    setContacts(prev => {
        if (prev.find(c => c.id === user.id)) {
            toast({
                title: "Contacto ya existe",
                description: `${user.name} ya está en tu lista de contactos.`
            });
            return prev;
        }
        toast({
            title: "¡Contacto Guardado!",
            description: `Has añadido a ${user.name} a tus contactos.`
        });
        return [...prev, user];
    });
  };

  const removeContact = (userId: string) => {
    setContacts(prev => prev.filter(c => c.id !== userId));
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
  
  const updateUserProfileAndGallery = (userId: string, imageOrId: GalleryImage | string, isDelete: boolean = false) => {
    updateUser(userId, (user) => {
      const currentGallery = user.gallery || [];
      let newGallery;

      if (isDelete) {
        newGallery = currentGallery.filter(image => image.id !== imageOrId);
        toast({ title: "Publicación Eliminada", description: "La imagen ha sido eliminada de tu galería." });
      } else {
        const newImage = imageOrId as GalleryImage;
        newGallery = [{ ...newImage, id: newImage.id || newImage.src }, ...currentGallery];
        toast({ title: "¡Publicación Exitosa!", description: "Tu nuevo contenido ya está en tu vitrina." });
      }

      return { gallery: newGallery };
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

  const addCommentToImage = (ownerId: string, imageId: string, commentText: string) => {
     updateUser(ownerId, (user) => {
        const newGallery = (user.gallery || []).map(img => {
            if (img.id === imageId) {
                const newComment = {
                    author: currentUser.name,
                    text: commentText,
                    profileImage: currentUser.profileImage,
                    likes: 0,
                    dislikes: 0,
                };
                return {
                    ...img,
                    comments: [...(img.comments || []), newComment]
                };
            }
            return img;
        });
        return { gallery: newGallery };
    });
  }

  const removeCommentFromImage = (ownerId: string, imageId: string, commentIndex: number) => {
     updateUser(ownerId, (user) => {
        const newGallery = (user.gallery || []).map(img => {
            if (img.id === imageId) {
                const newComments = [...(img.comments || [])];
                newComments.splice(commentIndex, 1);
                return { ...img, comments: newComments };
            }
            return img;
        });
        return { gallery: newGallery };
    });
  }

  const validateEmail = (userId: string) => {
    updateUser(userId, { emailValidated: true });
  }

  const validatePhone = (userId: string) => {
     updateUser(userId, { phoneValidated: true });
  }

  const updateFullProfile = (userId: string, data: ProfileSetupData) => {
    updateUser(userId, user => ({
      ...user,
      type: 'provider',
      email: data.email || user.email,
      phone: data.phone || user.phone,
      profileSetupData: {
        ...(user.profileSetupData || {}),
        ...data,
      }
    }));
  }

  const subscribeUser = (userId: string, planName: string, amount: number) => {
    const subscriptionTx: Transaction = {
        id: `sub-${Date.now()}`,
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-app',
        details: {
            system: `Pago de Suscripción: ${planName}`
        }
    };
    setTransactions(prev => [...prev, subscriptionTx]);
    router.push(`/quotes/payment?commitmentId=${subscriptionTx.id}&amount=${amount}`);
  }

  const activateTransactions = (userId: string, creditLimit: number) => {
    updateUser(userId, { isTransactionsActive: true, credicoraLimit: creditLimit, credicoraLevel: 1 });
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
  
  const activatePromotion = (details: { imageId: string, promotionText: string, cost: number }) => {
    const { imageId, promotionText, cost } = details;
    
    // 1. Create system transaction for the payment
    const promotionTx: Transaction = {
        id: `promo-tx-${Date.now()}`,
        type: 'Sistema',
        status: 'Pagado', // Assume payment is confirmed by the dialog flow
        date: new Date().toISOString(),
        amount: cost,
        clientId: currentUser.id,
        providerId: 'corabo-app',
        details: {
            system: `Pago por Promoción de 24h: "${promotionText}"`
        }
    };
    setTransactions(prev => [...prev, promotionTx]);

    // 2. Update the user's gallery item with promotion details
    updateUser(currentUser.id, user => {
        const newGallery = (user.gallery || []).map(img => {
            if (img.id === imageId) {
                return {
                    ...img,
                    promotion: {
                        text: promotionText,
                        expires: add(new Date(), { hours: 24 }).toISOString()
                    }
                };
            }
            return img;
        });
        return { gallery: newGallery };
    });
  };

  const createCampaign = (campaignDetails: any) => {
      const {
        publicationId,
        budget,
        durationDays,
        budgetLevel,
        dailyBudget,
        segmentation,
        financedWithCredicora,
        appliedSubscriptionDiscount,
      } = campaignDetails;

      const newCampaign: any = {
        id: `camp-${Date.now()}`,
        providerId: currentUser.id,
        publicationId,
        budget,
        durationDays,
        startDate: new Date().toISOString(),
        endDate: add(new Date(), { days: durationDays }).toISOString(),
        status: 'pending_payment',
        stats: { impressions: 0, reach: 0, clicks: 0, messages: 0 },
        budgetLevel,
        dailyBudget,
        segmentation,
        appliedSubscriptionDiscount,
        financedWithCredicora,
      };

      const campaignPaymentTx: Transaction = {
        id: `camp-tx-${newCampaign.id}`,
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: budget,
        clientId: currentUser.id,
        providerId: 'corabo-app',
        details: {
          system: `Pago de Campaña: ${durationDays} día(s) - Nivel ${budgetLevel}`,
        }
      };

      setTransactions(prev => [...prev, campaignPaymentTx]);
      
      // En un escenario real, tendríamos un estado para las campañas.
      // Aquí, podemos simplemente redirigir al pago.
      
      router.push(`/quotes/payment?commitmentId=${campaignPaymentTx.id}&amount=${budget}`);
      
      toast({
        title: "¡Casi listo! Procede al pago",
        description: "Tu campaña ha sido configurada. Realiza el pago para activarla."
      });
  };


  const downloadTransactionsPDF = () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const filteredTransactions = transactions.filter(tx => new Date(tx.date) >= threeMonthsAgo);

    if (filteredTransactions.length === 0) {
        toast({ title: "No hay transacciones", description: "No hay transacciones en los últimos 3 meses para imprimir." });
        return;
    }

    const doc = new jsPDF();
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
    if (!currentUser.isTransactionsActive) {
        toast({ variant: 'destructive', title: "Acción Requerida", description: "Debes activar tu registro de transacciones para aceptar propuestas." });
        return;
    }

    let transaction: Transaction | null = null;
    let clientIsSubscribed = false;

    setConversations(prevConvos => 
        prevConvos.map(convo => {
            if (convo.id === conversationId) {
                const newMessages = convo.messages.map(msg => {
                    if (msg.id === messageId && msg.proposal) {
                        const providerId = msg.senderId;
                        const clientId = convo.participantIds.find(p => p !== providerId)!;
                        const clientUser = users.find(u => u.id === clientId);
                        clientIsSubscribed = clientUser?.isSubscribed ?? false;

                        transaction = {
                            id: `txn-${Date.now()}`,
                            type: 'Servicio',
                            status: clientIsSubscribed ? 'Acuerdo Aceptado - Pendiente de Ejecución' : 'Finalizado - Pendiente de Pago',
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
      const toastDescription = clientIsSubscribed ? "Se ha creado un nuevo compromiso de pago." : "Debes pagar por adelantado para confirmar el servicio.";
      toast({ title: "Acuerdo Aceptado", description: toastDescription });
    }
  };


  const createAppointmentRequest = (request: AppointmentRequest) => {
    const provider = users.find(u => u.id === request.providerId);
    if (!provider || !provider.isTransactionsActive) {
      toast({ variant: 'destructive', title: "Proveedor no disponible", description: "Este proveedor no tiene activas las transacciones en este momento."});
      return;
    }

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

  const checkIfShouldBeEnterprise = (providerId: string): boolean => {
    const provider = users.find(u => u.id === providerId);
    if (!provider || provider.profileSetupData?.offerType !== 'product') {
        return false;
    }
    
    const providerTransactions = transactions.filter(
        tx => tx.providerId === providerId && (tx.status === 'Pagado' || tx.status === 'Resuelto')
    );

    for (let i = 0; i < 30; i++) {
        let hasEnoughSales = false;
        const targetDay = startOfDay(subDays(new Date(), i));
        
        const salesOnDay = providerTransactions.filter(tx => {
            const txDate = startOfDay(new Date(tx.date));
            return txDate.getTime() === targetDay.getTime();
        }).length;
        
        if (salesOnDay >= 5) {
            hasEnoughSales = true;
        }

        if (!hasEnoughSales) {
            return false;
        }
    }
    
    return true;
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
    addProduct,
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
    addCommentToImage,
    removeCommentFromImage,
    getCartItemQuantity,
    checkIfShouldBeEnterprise,
    activatePromotion,
    createCampaign,
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

    
