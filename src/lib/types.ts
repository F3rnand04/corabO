export type User = {
  id: string;
  name: string;
  type: 'client' | 'provider';
  reputation: number;
  verified?: boolean;
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
    delivery: boolean;
    deliveryCost: number;
  };
};
