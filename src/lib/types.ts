

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
  | 'Acuerdo Aceptado - Pendiente de Ejecución'
  | 'Servicio en Curso'
  | 'En Disputa'
  | 'Resuelto'
  | 'Recarga';

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
    quoteItems?: string[];
    delivery?: boolean;
    deliveryCost?: number;
    system?: string; // Description for system transactions e.g., 'Recarga de Saldo'
  };
};

export type Message = {
    senderId: string;
    text: string;
    timestamp: string;
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
};
