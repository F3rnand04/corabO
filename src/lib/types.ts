

export type Campaign = {
  id: string;
  providerId: string;
  publicationId: string; // La imagen de la galería que se promociona
  budget: number; // El dinero invertido
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'verified';
  stats: {
    impressions: number; // Veces que se mostró
    reach: number;       // Usuarios únicos alcanzados
    clicks: number;      // Clics al perfil
    messages: number;    // Mensajes iniciados desde la campaña
  };
  budgetLevel: 'basic' | 'advanced' | 'premium';
  dailyBudget: number;
  segmentation: {
    geographic?: string[];
    interests?: string[];
  };
  appliedSubscriptionDiscount?: number; // Ej: 0.10 para 10%
  financedWithCredicora: boolean;
};

export type GalleryImageComment = {
  author: string;
  text: string;
  likes?: number;
  dislikes?: number;
  profileImage?: string;
};

export type GalleryImage = {
  id: string;
  type: 'image' | 'video';
  src: string;
  alt: string;
  description: string;
  createdAt: string; // Added for chronological sorting
  comments?: GalleryImageComment[];
  isTemporary?: boolean; // Flag for promotions from clients
  promotion?: {
    text: string;
    expires: string;
  };
  campaignId?: string;
};

export type CredicoraLevel = {
    level: number;
    name: string;
    creditLimit: number;
    initialPaymentPercentage: number;
    installments: number;
    transactionsForNextLevel: number;
};

export const credicoraLevels: Record<string, CredicoraLevel> = {
    '1': {
        level: 1,
        name: 'Alfa',
        creditLimit: 150,
        initialPaymentPercentage: 0.60,
        installments: 3,
        transactionsForNextLevel: 25,
    },
    '2': {
        level: 2,
        name: 'Delta',
        creditLimit: 200,
        initialPaymentPercentage: 0.50,
        installments: 6,
        transactionsForNextLevel: 40,
    },
     '3': {
        level: 3,
        name: 'Lambda',
        creditLimit: 300,
        initialPaymentPercentage: 0.40,
        installments: 9,
        transactionsForNextLevel: 60,
    },
    '4': {
        level: 4,
        name: 'Sigma',
        creditLimit: 600,
        initialPaymentPercentage: 0.30,
        installments: 12,
        transactionsForNextLevel: 80,
    },
    '5': {
        level: 5,
        name: 'Omega',
        creditLimit: 1000,
        initialPaymentPercentage: 0.0,
        installments: 18,
        transactionsForNextLevel: 150,
    },
};

export type ProfileSetupData = {
  username?: string;
  useUsername?: boolean;
  categories?: string[];
  primaryCategory?: string | null;
  specialty?: string;
  providerType?: 'professional' | 'company';
  offerType?: 'product' | 'service';
  hasPhysicalLocation?: boolean;
  location?: string;
  showExactLocation?: boolean;
  serviceRadius?: number;
  isOnlyDelivery?: boolean;
  website?: string;
  schedule?: Record<string, { from: string; to: string; active: boolean }>;
  acceptsCredicora?: boolean;
  appointmentCost?: number;
};


export type User = {
  id: string;
  coraboId?: string;
  name: string;
  lastName?: string;
  idNumber?: string;
  birthDate?: string;
  type: 'client' | 'provider';
  reputation: number;
  profileImage: string;
  email: string;
  phone: string;
  emailValidated: boolean;
  phoneValidated: boolean;
  isGpsActive: boolean;
  verified?: boolean;
  isSubscribed?: boolean;
  isTransactionsActive?: boolean;
  isInitialSetupComplete?: boolean;
  credicoraLimit?: number;
  credicoraLevel?: number;
  promotion?: {
    text: string;
    expires: string;
  };
  gallery?: GalleryImage[];
  profileSetupData?: ProfileSetupData;
  isPaused?: boolean;
  pauseReason?: string;
  activeCampaignIds?: string[];
  role?: 'admin';
  idDocumentUrl?: string;
  idVerificationStatus?: 'pending' | 'verified' | 'rejected';
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  providerId: string;
  imageUrl: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  providerId: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type TransactionStatus =
  | 'Carrito Activo'
  | 'Pre-factura Pendiente'
  | 'Pagado'
  | 'Solicitud Pendiente'
  | 'Cotización Recibida'
  | 'Cita Solicitada'
  | 'Acuerdo Aceptado - Pendiente de Ejecución'
  | 'Finalizado - Pendiente de Pago'
  | 'Servicio en Curso'
  | 'En Disputa'
  | 'Resuelto'
  | 'Recarga'
  | 'Pendiente de Confirmación del Cliente'
  | 'Pago Enviado - Esperando Confirmación'
  | 'En Reparto'; // New status for delivery

export type AgreementProposal = {
    title: string;
    description: string;
    amount: number;
    deliveryDate: string;
    acceptsCredicora: boolean;
};

export type Transaction = {
  id: string;
  type: 'Compra' | 'Servicio' | 'Sistema' | 'Delivery';
  status: TransactionStatus;
  date: string;
  amount: number;
  clientId: string;
  providerId?: string; // Optional for system transactions
  participantIds?: string[]; // For Firestore queries
  details: {
    items?: CartItem[];
    serviceName?: string;
    quote?: {
      breakdown: string;
      total: number;
    };
    proposal?: AgreementProposal;
    quoteItems?: string[];
    delivery?: boolean;
    deliveryCost?: number;
    deliveryProviderId?: string; // To link the delivery provider
    system?: string; // Description for system transactions e.g., 'Recarga de Saldo'
    paymentMethod?: 'direct' | 'credicora';
    initialPayment?: number;
    totalAmount?: number;
    financedAmount?: number;
    clientRating?: number;
    clientComment?: string;
    paymentFromThirdParty?: boolean;
    originAddress?: string; // For delivery
    destinationAddress?: string; // For delivery
    paymentVoucherUrl?: string; // For admin verification
  };
};

export type Message = {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    isRead: boolean;
    type?: 'text' | 'proposal';
    proposal?: AgreementProposal;
    isProposalAccepted?: boolean;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    messages: Message[];
    lastUpdated: string;
};

export type AppointmentRequest = {
    providerId: string;
    date: Date;
    details: string;
    amount: number;
};
export type VerificationOutput = {
    extractedName: string;
    extractedId: string;
    nameMatch: boolean;
    idMatch: boolean;
};
