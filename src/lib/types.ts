


export type GalleryImageComment = {
  author: string;
  text: string;
  likes?: number;
  dislikes?: number;
  profileImage?: string;
};

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  description: string;
  comments?: GalleryImageComment[];
  promotion?: {
    text: string;
    expires: string;
  };
};

export type CredicoraLevel = {
    level: number;
    name: string;
    creditLimit: number;
    initialPaymentPercentage: number;
    installments: number;
};

export const credicoraLevels: Record<string, CredicoraLevel> = {
    '1': {
        level: 1,
        name: 'Alfa',
        creditLimit: 150,
        initialPaymentPercentage: 0.60,
        installments: 3,
    },
    '2': {
        level: 2,
        name: 'Delta',
        creditLimit: 200,
        initialPaymentPercentage: 0.50,
        installments: 6,
    },
     '3': {
        level: 3,
        name: 'Lambda',
        creditLimit: 300,
        initialPaymentPercentage: 0.40,
        installments: 9,
    },
    '4': {
        level: 4,
        name: 'Sigma',
        creditLimit: 600,
        initialPaymentPercentage: 0.30,
        installments: 12,
    },
    '5': {
        level: 5,
        name: 'Omega',
        creditLimit: 1000,
        initialPaymentPercentage: 0.0,
        installments: 18,
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
  name: string;
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
  credicoraLimit?: number;
  credicoraLevel?: number;
  promotion?: {
    text: string;
    expires: string;
  };
  gallery?: GalleryImage[];
  profileSetupData?: ProfileSetupData;
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
  | 'Pago Enviado - Esperando Confirmación';

export type AgreementProposal = {
    title: string;
    description: string;
    amount: number;
    deliveryDate: string;
    acceptsCredicora: boolean;
};

export type Transaction = {
  id: string;
  type: 'Compra' | 'Servicio' | 'Sistema';
  status: TransactionStatus;
  date: string;
  amount: number;
  clientId: string;
  providerId?: string; // Optional for system transactions
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
    system?: string; // Description for system transactions e.g., 'Recarga de Saldo'
    paymentMethod?: 'direct' | 'credicora';
    initialPayment?: number;
    totalAmount?: number;
    clientRating?: number;
    clientComment?: string;
    paymentFromThirdParty?: boolean;
  };
};

export type Message = {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    type?: 'text' | 'proposal';
    proposal?: AgreementProposal;
    isProposalAccepted?: boolean;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    messages: Message[];
    unreadCount?: number;
};

export type AppointmentRequest = {
    providerId: string;
    date: Date;
    details: string;
    amount: number;
};
