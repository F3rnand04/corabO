

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  description: string;
  comments?: {
    author: string;
    text: string;
  }[];
  promotion?: {
    text: string;
    expires: string;
  };
};

export type User = {
  id: string;
  name: string;
  type: 'client' | 'provider';
  reputation: number;
  profileImage: string;
  verified?: boolean;
  promotion?: {
    text: string;
    expires: string;
  };
  gallery?: GalleryImage[];
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
  | 'Resuelto';

export type Transaction = {
  id: string;
  type: 'Compra' | 'Servicio';
  status: TransactionStatus;
  date: string;
  amount: number;
  clientId: string;
  providerId: string;
  details: {
    items?: CartItem[];
    serviceName?: string;
    quote?: {
      breakdown: string;
      total: number;
    };
    quoteItems?: string[];
    delivery: boolean;
    deliveryCost: number;
  };
};
