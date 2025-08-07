

import type { User, Product, Service, Transaction, Conversation, AgreementProposal } from './types';
import { add } from 'date-fns';

export const users: User[] = [
  { id: 'corabo-admin', name: 'CorabO Admin', type: 'client', role: 'admin', reputation: 5, profileImage: 'https://i.postimg.cc/Wz1MTvWK/lg.png', email: 'admin@corabo.app', phone: '0', emailValidated: true, phoneValidated: true, isGpsActive: false, gallery: [] },
  {
    id: 'provider1',
    name: 'Ana Rivas',
    type: 'provider',
    reputation: 4.9,
    profileImage: 'https://i.postimg.cc/d1P6gGZf/plumber-woman.png',
    email: 'ana.rivas@example.com',
    phone: '555-0101',
    emailValidated: true,
    phoneValidated: true,
    isGpsActive: true,
    verified: true,
    isSubscribed: true,
    isTransactionsActive: true,
    credicoraLevel: 3,
    credicoraLimit: 300,
    profileSetupData: {
      username: 'AnaPlomeria',
      useUsername: true,
      categories: ['Hogar y Reparaciones'],
      primaryCategory: 'Hogar y Reparaciones',
      specialty: 'Soluciones expertas para tu hogar.',
      providerType: 'professional',
      offerType: 'service',
      hasPhysicalLocation: false,
      location: 'Caracas, Venezuela',
      showExactLocation: false,
      serviceRadius: 25,
      isOnlyDelivery: false,
      acceptsCredicora: true,
      appointmentCost: 10,
      schedule: {
        'Lunes': { from: '08:00', to: '18:00', active: true },
        'Martes': { from: '08:00', to: '18:00', active: true },
        'Miércoles': { from: '08:00', to: '18:00', active: true },
        'Jueves': { from: '08:00', to: '18:00', active: true },
        'Viernes': { from: '08:00', to: '18:00', active: true },
        'Sábado': { from: '09:00', to: '14:00', active: true },
        'Domingo': { from: '09:00', to: '17:00', active: false },
      },
    },
    gallery: [
      { id: 'gal-ana-1', type: 'image', src: 'https://i.postimg.cc/cLDw0Wz1/plumber-woman-work.png', alt: 'Plomería profesional', description: 'Instalación y reparación de tuberías con la mejor calidad.', comments: [] },
      { id: 'gal-ana-2', type: 'image', src: 'https://i.postimg.cc/HxbYVz75/plumbing-tools.png', alt: 'Herramientas de plomería', description: 'Contamos con las herramientas adecuadas para cada trabajo.', comments: [] },
    ],
  },
  {
    id: 'provider2',
    name: 'Tecno Soluciones S.A.',
    type: 'provider',
    reputation: 5.0,
    profileImage: 'https://i.postimg.cc/V64yXZxS/tech-logo.png',
    email: 'ventas@tecnosoluciones.com',
    phone: '555-0202',
    emailValidated: true,
    phoneValidated: true,
    isGpsActive: true,
    verified: true,
    isSubscribed: true,
    isTransactionsActive: true,
    credicoraLevel: 5,
    credicoraLimit: 1000,
    profileSetupData: {
      username: 'TecnoSoluciones',
      useUsername: true,
      categories: ['Tecnología y Soporte', 'Automotriz y Repuestos'],
      primaryCategory: 'Tecnología y Soporte',
      specialty: 'Tu tienda de tecnología de confianza.',
      providerType: 'company',
      offerType: 'product',
      hasPhysicalLocation: true,
      location: 'Centro Comercial Líder, Caracas',
      showExactLocation: true,
      isOnlyDelivery: false,
      website: 'https://tecnosoluciones.com',
      acceptsCredicora: true,
      schedule: {
        'Lunes': { from: '10:00', to: '20:00', active: true },
        'Martes': { from: '10:00', to: '20:00', active: true },
        'Miércoles': { from: '10:00', to: '20:00', active: true },
        'Jueves': { from: '10:00', to: '20:00', active: true },
        'Viernes': { from: '10:00', to: '21:00', active: true },
        'Sábado': { from: '10:00', to: '21:00', active: true },
        'Domingo': { from: '12:00', to: '19:00', active: true },
      },
    },
    gallery: [
      { id: 'gal-tecno-1', type: 'image', src: 'https://i.postimg.cc/qR0Y632z/tech-store.png', alt: 'Tienda de tecnología', description: 'Visítanos en nuestra tienda física.', comments: [] },
    ],
  },
];

export const products: Product[] = [
  { id: 'prod1', name: 'Laptop Pro X15', description: 'Potente laptop para profesionales y gamers.', price: 1200, category: 'Tecnología y Soporte', providerId: 'provider2', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'prod2', name: 'Smartphone Galaxy Z', description: 'El último modelo con cámara de 108MP.', price: 950, category: 'Tecnología y Soporte', providerId: 'provider2', imageUrl: 'https://placehold.co/600x400.png' },
];

export const services: Service[] = [
  { id: 'serv1', name: 'Reparación de Tuberías', description: 'Servicio completo de reparación de fugas y tuberías rotas.', category: 'Hogar y Reparaciones', providerId: 'provider1' },
  { id: 'serv2', name: 'Instalación de Grifería', description: 'Instalamos todo tipo de grifos para baños y cocinas.', category: 'Hogar y Reparaciones', providerId: 'provider1' },
];

export const initialTransactions: Transaction[] = [];

export const initialConversations: Conversation[] = [];
