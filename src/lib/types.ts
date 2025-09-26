import { z } from 'zod';

export type FirebaseUserInput = { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; phoneNumber?: string | null; emailVerified: boolean; };

export type Affiliation = {
  id: string;
  providerId: string;
  companyId: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: string;
  updatedAt: string;
  handledBy?: string; // Admin who handled the request
};


export type QrSession = {
  id: string;
  providerId: string;
  clientId?: string;
  cashierId?: string; 
  cashierName?: string; // NEW: To store the name of the cashier
  status: 'pendingAmount' | 'pendingClientApproval' | 'awaitingPayment' | 'pendingVoucherUpload' | 'completed' | 'cancelled' | 'awaiting_scan' | 'closed';
  amount?: number;
  initialPayment?: number;
  financedAmount?: number;
  installments?: number;
  voucherUrl?: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  participantIds?: string[];
  transactionId?: string;
  cashierBoxId?: string; // To link the session to a specific box
};

export type NotificationType = 'new_campaign' | 'payment_reminder' | 'admin_alert' | 'welcome' | 'affiliation_request' | 'payment_warning' | 'payment_due' | 'new_publication' | 'cashier_request' | 'new_quote_request' | 'tutorial_request' | 'tutorial_payment_request' | 'live_access_request' | 'monthly_invoice';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  timestamp: string;
  metadata?: { 
    requestId?: string;
    handled?: boolean;
    publicationId?: string;
    requesterId?: string;
    requesterName?: string;
    liveStreamId?: string; // For live stream notifications
    invoiceDetails?: {
        subtotal: number;
        iva: number;
        total: number;
    }
  }
}

export type Campaign = {
  id: string;
  providerId: string;
  publicationId: string; // La imagen de la galería que se promociona
  budget: number; // El dinero invertido
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'pending_payment' | 'active' | 'completed' | 'cancelled';
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
  authorId: string; // New field to identify the author for deletion
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
    providerType?: 'professional' | 'company' | 'delivery' | 'lodging' | 'tourism';
    username?: string;
    primaryCategory?: string | null;
    location?: string;
    showExactLocation?: boolean;
  }
  activeAffiliation?: {
    companyId: string;
    companyName: string;
    companyProfileImage: string;
    companySpecialty: string;
  } | null;
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
    publicationId: string;
  };
  campaignId?: string;
  likes?: number;
  owner?: PublicationOwner; 
  productDetails?: ProductDetails;
  isTutorial?: boolean;
  tutorialPrice?: number;
  searchKeywords?: string[];
  aspectRatio?: 'square' | 'horizontal' | 'vertical';
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

// New type for specialized data
export type SpecializedData = {
    // Transporte y Asistencia
    vehicleType?: string;
    capacity?: string;
    specialConditions?: string;

    // Salud y Bienestar
    licenseNumber?: string;
    specialties?: string[];
    consultationMode?: 'office' | 'home' | 'online' | 'hybrid' | 'facilities' | 'ambulance' | 'telemedicine' | 'hybrid_company';
    
    // Alimentos y Restaurantes
    cuisineTypes?: string[];
    serviceOptions?: {
        local?: boolean;
        pickup?: boolean;
        own_delivery?: boolean;
        corabo_delivery?: boolean;
        catering?: boolean;
    };
    menuUrl?: string;
    sanitaryPermitId?: string;

    // Hogar y Reparaciones
    mainTrades?: string[];
    specificSkills?: string[];
    
    // Automotriz y Repuestos
    mainServices?: string[];
    brandsServed?: string[];

    // Common fields
    certifications?: string;

    // Belleza
    beautyTrades?: string[];

    // Professional Services (Tech, Education, Events)
    keySkills?: string[];
    toolsAndBrands?: string;
    yearsOfExperience?: number;

    // Tourism and Lodging
    amenities?: string[];
    lodgingType?: string;
    tourType?: string;
    duration?: string;
    includedServices?: string[];
};

// NEW: Type for a single cashier box
export type CashierBox = {
  id: string;
  name: string;
  passwordHash: string; // In a real app, this should be a secure hash
  qrValue: string; // The JSON string value for the QR
  qrDataURL?: string; // The generated image data URL for the QR
  isActive?: boolean;
};

export type LegalRepresentative = {
  name: string;
  position?: string;
  idNumber: string;
  phone?: string;
};

export type ProfileSetupData = {
  username?: string;
  useUsername?: boolean;
  categories?: string[];
  primaryCategory?: string | null;
  specialty?: string;
  country?: string;
  providerType?: 'professional' | 'company' | 'delivery' | 'lodging' | 'tourism';
  offerType?: 'product' | 'service' | 'both';
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
  };
  specializedData?: SpecializedData;
  legalRepresentative?: LegalRepresentative;
  // NEW: Cashier boxes for company accounts
  cashierBoxes?: CashierBox[];
  adminPassword?: string;
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
  effectiveness: number;
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
    publicationId: string;
  };
  profileSetupData?: ProfileSetupData;
  isPaused?: boolean;
  pauseReason?: string;
  pausedBy?: string; // Admin who paused the account
  suspensionLiftDate?: string; // Timestamp for when suspension is lifted
  activeCampaignIds?: string[];
  role?: 'admin' | 'manager'; // NEW: Add manager role
  managementRole?: 'payment_verifier' | 'document_verifier' | 'dispute_manager' | 'affiliation_manager' | 'quality_auditor' | 'customer_support' | 'accountant';
  idDocumentUrl?: string | null;
  idVerificationStatus?: 'pending' | 'verified' | 'rejected';
  idRejectionReason?: string;
  idVerificationDate?: string; // Timestamp of verification
  idVerifiedBy?: string; // Admin who verified
  phoneVerificationCode?: string | null;
  phoneVerificationCodeExpires?: string | null;
  credicoraDetails?: CredicoraLevel;
  activeAffiliation?: {
    companyId: string;
    companyName: string;
    companyProfileImage: string;
    companySpecialty: string;
  } | null;
  lastActivityAt?: string; // New field to track last activity
  contacts?: string[]; // Array of user IDs
  lastFreeQuoteAt?: string; // Tracks the last free quote for non-subscribed users
  giftCredits?: number; // New field for gift credits balance
  activeLiveStreamId?: string; // ID of the current live stream
  fcmToken?: string | null; // FCM token for push notifications
  thirdPartyPaymentOffenses?: number; // Tracks violations for payments from non-holder accounts
  cart?: CartItem[]; // Shopping cart data is now part of the user document
};

// NEW: Data model for live streams
export type LiveStream = {
    id: string;
    creatorId: string;
    status: 'upcoming' | 'live' | 'ended';
    visibility: 'public' | 'private';
    title: string;
    description?: string;
    accessCostCredits?: number;
    startedAt?: string;
    endedAt?: string;
    // Arrays of user IDs
    pendingRequests?: string[];
    approvedViewers?: string[];
    // Placeholder for actual stream URLs
    streamUrl?: string; 
    playbackUrl?: string;
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
  | 'En Reparto'
  | 'Error de Delivery - Acción Requerida'
  | 'Listo para Retirar en Tienda'
  | 'En Cobranza'
  | 'Incobrable';

export type AgreementProposal = {
    title: string;
    description: string;
    amount: number;
    deliveryDate: string;
    acceptsCredicora: boolean;
    // NEW FIELDS
    pricingModel?: 'fixed' | 'hourly';
    hourlyRate?: number;
    estimatedHours?: number;
};

export type Message = {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    isRead: boolean;
    type?: 'text' | 'proposal' | 'location' | 'image' | 'document';
    proposal?: AgreementProposal;
    location?: { lat: number; lon: number };
    media?: {
        url: string;
        fileName?: string;
        fileType?: string;
    };
    isProposalAccepted?: boolean;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    participants: { [key: string]: { name: string, profileImage: string } };
    messages: Message[];
    lastUpdated: string;
};

export type Transaction = {
  id: string;
  type: 'Compra' | 'Servicio' | 'Sistema' | 'Compra Directa' | 'Cotización' | 'Tutorial';
  status: TransactionStatus;
  date: string; // ISO 8601 string
  amount: number; // Monto en moneda local
  participantIds: string[];
  clientId: string;
  providerId: string;
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
    delivery?: {
      method: 'pickup' | 'home' | 'other_address' | 'current_location';
      address?: string;
      recipientInfo?: {
        name: string;
        phone: string;
      };
    };
    deliveryCost?: number;
    deliveryProviderId?: string;

    // For payments
    paymentMethod?: 'Efectivo' | 'Transferencia' | 'Pago Móvil' | 'Binance' | 'credicora' | 'direct' | 'creditos_regalo';
    initialPayment?: number;
    financedAmount?: number;
    paymentConfirmationDate?: string;
    paymentVerifiedBy?: string; // Admin who verified the payment
    paymentVoucherUrl?: string;
    paymentReference?: string;
    paymentFromThirdParty?: boolean;
    paymentRequestedAt?: string; // Timestamp for when payment was requested
    paymentSentAt?: string; // Timestamp for when client sends payment

    // For system
    system?: string;
    isSubscription?: boolean;
    isRenewable?: boolean;
    // For gifts
    giftName?: string;
    creditValue?: number;
    
    // For feedback
    clientRating?: number;
    clientComment?: string;
    providerRating?: number;
    providerComment?: string;

    // For commission and taxes
    amountUSD?: number; // Monto original en USD
    baseAmount?: number; // Base amount in local currency for invoices
    commissionRate?: number;
    commission?: number; // Commission amount in local currency
    taxRate?: number;
    tax?: number; // Tax amount in local currency for invoices
    total?: number; // Final total in local currency
    exchangeRate?: number; // Tasa de cambio al momento de la creación
    invoiceId?: string; // ID of the master monthly invoice
    commissionedTransactionIds?: string[];
    
    // For cashier payments
    cashierBoxId?: string;
    cashierName?: string;
    qrSessionId?: string;

    // For tutorials
    tutorialId?: string;
    tutorialName?: string;
  };
  lastUpdated?: string;
};

// --- Schemas moved to types.ts to avoid circular dependencies ---

// Schema for creating a quote request from the /quotes page
export const QuoteRequestInputSchema = z.object({
  clientId: z.string(),
  title: z.string().min(5, "El título es muy corto."),
  description: z.string().min(20, "La descripción debe ser más detallada."),
  category: z.string({ required_error: "Debes seleccionar una categoría." }),
  isPaid: z.boolean().optional(), // To indicate if a payment flow is triggered
});
export type QuoteRequestInput = z.infer<typeof QuoteRequestInputSchema>;


export type TempRecipientInfo = {
    name: string;
    phone: string;
}

export type Gift = {
  id: string;
  name: string;
  price: number;
  credits: number;
  icon: string; // URL to an icon/image for the gift
};

// Schemas for Verification Flow
export const VerificationInputSchema = z.object({
  userId: z.string(),
  nameInRecord: z.string(),
  idInRecord: z.string(),
  documentImageUrl: z.string(),
  isCompany: z.boolean().optional(),
});
export type VerificationInput = z.infer<typeof VerificationInputSchema>;

export const VerificationOutputSchema = z.object({
  extractedName: z.string().describe("The full name of the person or company as it appears on the document."),
  extractedId: z.string().describe("The ID number (cédula, RIF, NIT, etc.) as it appears on the document."),
  nameMatch: z.boolean(),
  idMatch: z.boolean(),
});
export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;


// Schemas for Publication Flow
export interface CreatePublicationInput {
  userId: string;
  description: string;
  imageDataUri: string;
  aspectRatio: 'square' | 'horizontal' | 'vertical';
  type: 'image' | 'video';
}

export interface CreateProductInput {
    userId: string;
    name: string;
    description: string;
    price: number;
    imageDataUri: string;
}

export interface AddCommentInput {
  imageId: string;
  commentText: string;
  author: {
    id: string;
    name: string;
    profileImage: string;
  };
  ownerId: string;
}

export interface RemoveCommentInput {
  imageId: string;
  commentIndex: number;
  authorId: string;
}

export interface UpdateGalleryImageInput {
  imageId: string;
  updates: {
    description?: string;
    imageDataUri?: string;
  }
}

export interface RemoveGalleryImageInput {
  imageId: string;
}

// --- NEWLY MOVED SCHEMAS ---

export const GetFeedInputSchema = z.object({
  limitNum: z.number().optional(),
  startAfterDocId: z.string().optional(),
  searchQuery: z.string().optional(),
  categoryFilter: z.string().optional(),
});
export type GetFeedInput = z.infer<typeof GetFeedInputSchema>;

export const GetFeedOutputSchema = z.object({
  publications: z.array(z.any()),
  lastVisibleDocId: z.string().optional(),
});
export type GetFeedOutput = z.infer<typeof GetFeedOutputSchema>;

// NEW: Data model for dispute cases
export type DisputeCase = {
  id: string; // Corresponds to the transaction ID
  status: 'open' | 'investigating' | 'resolved';
  clientId: string;
  providerId: string;
  managerId?: string; // Admin handling the case
  createdAt: string;
  lastUpdated: string;
  resolutionNotes?: string;
  finalResolution?: 'refund_client' | 'pay_provider' | 'partial_refund' | 'no_action';
};

export type SanctionReason = 
    | "Contenido Engañoso o Spam"
    | "Suplantación de Identidad"
    | "Incitación al Odio o Acoso"
    | "Promoción de Actividades Ilegales"
    | "Contenido Explícito o Inapropiado";

// NEW: Data model for content reports
export type ContentReport = {
  id: string;
  reporterId: string;
  reportedContentId: string; // Can be a publication ID or a user ID
  reportedUserId: string; // The user who owns the content
  contentType: 'publication' | 'profile';
  reason: SanctionReason;
  description?: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  sanctionReason?: SanctionReason; // Reason selected by admin
};
