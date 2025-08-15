

import { z } from 'zod';

export type QrSession = {
  id: string;
  providerId: string;
  clientId: string;
  status: 'pendingAmount' | 'pendingClientApproval' | 'pendingVoucherUpload' | 'completed' | 'cancelled';
  amount?: number;
  initialPayment?: number;
  financedAmount?: number;
  installments?: number;
  voucherUrl?: string;
  createdAt: string;
  updatedAt: string;
  participantIds: string[];
};

export type Notification = {
  id: string;
  userId: string;
  type: 'new_campaign' | 'payment_reminder' | 'admin_alert' | 'welcome';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  timestamp: string;
}

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

export type PublicationOwner = {
  id: string;
  name: string;
  profileImage: string;
  verified?: boolean;
  isGpsActive?: boolean;
  reputation?: number;
  profileSetupData?: {
    specialty?: string;
    providerType?: 'professional' | 'company';
    username?: string;
    primaryCategory?: string;
  }
};

export type ProductDetails = {
    name: string;
    price: number;
    category: string;
};

export type GalleryImage = {
  id: string;
  providerId: string;
  type: 'image' | 'video' | 'product';
  src: string;
  alt: string;
  description: string;
  createdAt: string;
  comments?: GalleryImageComment[];
  isTemporary?: boolean;
  promotion?: {
    text: string;
    expires: string;
  };
  campaignId?: string;
  aspectRatio?: 'square' | 'horizontal' | 'vertical';
  likes?: number;
  owner?: PublicationOwner; // Denormalized owner data
  productDetails?: ProductDetails; // Product-specific data
};

export type CredicoraLevel = {
    level: number;
    name: string;
    color: string; // HEX or HSL color string
    creditLimit: number;
    initialPaymentPercentage: number;
    installments: number;
    transactionsForNextLevel: number;
};

export const credicoraLevels: Record<string, CredicoraLevel> = {
    '1': {
        level: 1,
        name: 'Alfa',
        color: '#3b82f6', // blue-500
        creditLimit: 150,
        initialPaymentPercentage: 0.60,
        installments: 3,
        transactionsForNextLevel: 25,
    },
    '2': {
        level: 2,
        name: 'Delta',
        color: '#8b5cf6', // violet-500
        creditLimit: 200,
        initialPaymentPercentage: 0.50,
        installments: 6,
        transactionsForNextLevel: 40,
    },
     '3': {
        level: 3,
        name: 'Lambda',
        color: '#ec4899', // pink-500
        creditLimit: 300,
        initialPaymentPercentage: 0.40,
        installments: 9,
        transactionsForNextLevel: 60,
    },
    '4': {
        level: 4,
        name: 'Sigma',
        color: '#f97316', // orange-500
        creditLimit: 600,
        initialPaymentPercentage: 0.30,
        installments: 12,
        transactionsForNextLevel: 80,
    },
    '5': {
        level: 5,
        name: 'Omega',
        color: '#ca8a04', // yellow-600 (gold)
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
  country?: string;
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
  paymentDetails?: {
    account?: {
        active: boolean;
        bankName: string;
        accountNumber: string;
    },
    mobile?: {
        active: boolean;
        bankName: string;
        mobilePaymentPhone: string;
    },
    crypto?: {
        active: boolean;
        binanceEmail: string;
        validated: boolean;
    }
  }
};


export type User = {
  id: string;
  coraboId?: string;
  name: string;
  lastName?: string;
  idNumber?: string;
  birthDate?: string;
  country?: string;
  createdAt?: string;
  type: 'client' | 'provider' | 'repartidor';
  reputation: number;
  effectiveness?: number;
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
  profileSetupData?: ProfileSetupData;
  isPaused?: boolean;
  pauseReason?: string;
  activeCampaignIds?: string[];
  role?: 'admin';
  idDocumentUrl?: string;
  idVerificationStatus?: 'pending' | 'verified' | 'rejected';
  phoneVerificationCode?: string | null;
  phoneVerificationCodeExpires?: string | null;
  credicoraDetails?: CredicoraLevel;
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
  | 'Buscando Repartidor'
  | 'En Reparto';

export type AgreementProposal = {
    title: string;
    description: string;
    amount: number;
    deliveryDate: string;
    acceptsCredicora: boolean;
};

export type Message = {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    isRead: boolean;
    type?: 'text' | 'proposal' | 'location';
    proposal?: AgreementProposal;
    location?: { lat: number, lon: number };
    isProposalAccepted?: boolean;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    messages: Message[];
    lastUpdated: string;
};

export type Transaction = {
  id: string;
  type: 'Compra' | 'Servicio' | 'Sistema' | 'Compra Directa';
  status: TransactionStatus;
  date: string; // ISO 8601 string
  amount: number;
  clientId: string;
  providerId: string;
  participantIds: string[];
  details: {
    // For services
    serviceName?: string;
    quote?: {
      breakdown: string;
      total: number;
    };
    proposal?: AgreementProposal;

    // For products
    items?: CartItem[];
    delivery?: boolean;
    deliveryCost?: number;
    deliveryProviderId?: string;
    deliveryLocation?: { lat: number; lon: number; address: string };

    // For payments
    paymentMethod?: 'direct' | 'credicora';
    initialPayment?: number;
    financedAmount?: number;
    paymentConfirmationDate?: string;
    paymentVoucherUrl?: string;
    paymentFromThirdParty?: boolean;

    // For system
    system?: string;
    isSubscription?: boolean;
    isRenewable?: boolean;

    // For feedback
    clientRating?: number;
    clientComment?: string;
    providerRating?: number;
    providerComment?: string;
  };
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

// Schemas from feed-flow
const PublicationSchema = z.any();

export const GetFeedInputSchema = z.object({
    limitNum: z.number().optional().default(10),
    startAfterDocId: z.string().optional(),
});

export const GetFeedOutputSchema = z.object({
    publications: z.array(PublicationSchema),
    lastVisibleDocId: z.string().nullable(),
});

// Schemas from profile-flow
const GalleryImageSchema = z.any();
const ProductSchema = z.any();

export const GetProfileGalleryInputSchema = z.object({
    userId: z.string(),
    limitNum: z.number().optional().default(9),
    startAfterDocId: z.string().optional(),
});

export const GetProfileGalleryOutputSchema = z.object({
    gallery: z.array(GalleryImageSchema),
    lastVisibleDocId: z.string().optional(),
});

export const GetProfileProductsInputSchema = z.object({
    userId: z.string(), // providerId
    limitNum: z.number().optional().default(10),
    startAfterDocId: z.string().optional(),
});

export const GetProfileProductsOutputSchema = z.object({
    products: z.array(ProductSchema),
    lastVisibleDocId: z.string().optional(),
});

// Schemas from publication-flow
export const CreatePublicationInputSchema = z.object({
  userId: z.string(),
  description: z.string(),
  imageDataUri: z.string(),
  aspectRatio: z.enum(['square', 'horizontal', 'vertical']),
  type: z.enum(['image', 'video']),
});
export type CreatePublicationInput = z.infer<typeof CreatePublicationInputSchema>;

export const CreateProductInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageDataUri: z.string(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;
