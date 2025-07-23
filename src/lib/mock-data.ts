import type { User, Product, Service, Transaction } from './types';

export const users: User[] = [
  { id: 'client1', name: 'Juan Cliente', type: 'client', reputation: 4.5 },
  { id: 'provider1', name: 'Tecno Soluciones S.A.', type: 'provider', reputation: 4.8 },
  { id: 'provider2', name: 'Hogar Feliz Servicios', type: 'provider', reputation: 4.2 },
];

export const products: Product[] = [
  {
    id: 'prod1',
    name: 'Laptop Pro 15"',
    description: 'Potente laptop para profesionales y creativos.',
    price: 1200,
    category: 'Tecnología',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'prod2',
    name: 'Smartphone Avanzado',
    description: 'El último modelo con cámara de alta resolución.',
    price: 800,
    category: 'Tecnología',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'prod3',
    name: 'Kit de Herramientas Básico',
    description: 'Todo lo que necesitas para reparaciones en casa.',
    price: 75,
    category: 'Hogar',
    providerId: 'provider2',
    imageUrl: 'https://placehold.co/600x400.png',
  },
    {
    id: 'prod4',
    name: 'Monitor UltraWide 34"',
    description: 'Expande tu visión de trabajo con este monitor curvo.',
    price: 550,
    category: 'Tecnología',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
];

export const services: Service[] = [
  {
    id: 'serv1',
    name: 'Instalación de Electrodomésticos',
    description: 'Instalación profesional y segura de cualquier electrodoméstico.',
    category: 'Hogar',
    providerId: 'provider2',
  },
  {
    id: 'serv2',
    name: 'Reparación de Computadoras',
    description: 'Diagnóstico y reparación de hardware y software.',
    category: 'Tecnología',
    providerId: 'provider1',
  },
  {
    id: 'serv3',
    name: 'Consulta Médica General',
    description: 'Atención primaria de salud por un médico certificado.',
    category: 'Salud',
    providerId: 'provider2',
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: 'txn1',
    type: 'Compra',
    status: 'Pagado',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 875.00,
    clientId: 'client1',
    providerId: 'provider1',
    details: {
      items: [
        { product: products[1], quantity: 1 },
      ],
      delivery: true,
      deliveryCost: 75.00,
    },
  },
  {
    id: 'txn2',
    type: 'Servicio',
    status: 'Resuelto',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 150.00,
    clientId: 'client1',
    providerId: 'provider2',
    details: {
      serviceName: 'Instalación de Electrodomésticos',
      quote: {
        breakdown: 'Instalación de lavadora y secadora.',
        total: 150.00,
      },
       delivery: false,
       deliveryCost: 0,
    },
  },
];
