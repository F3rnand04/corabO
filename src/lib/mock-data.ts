

import type { User, Product, Service, Transaction, Conversation, AgreementProposal } from './types';
import { add } from 'date-fns';

export const users: User[] = [
  { id: 'corabo-admin', name: 'CorabO Admin', type: 'client', role: 'admin', reputation: 5, profileImage: 'https://i.postimg.cc/Wz1MTvWK/lg.png', email: 'admin@corabo.app', phone: '0', emailValidated: true, phoneValidated: true, isGpsActive: false, gallery: [] },
  { id: 'guest', name: 'Guest', type: 'client', reputation: 0, profileImage: '', email: '', phone: '', emailValidated: false, phoneValidated: false, isGpsActive: false, gallery: [] },
  { id: 'client1', name: 'Juan Cliente', type: 'client', reputation: 4.5, profileImage: `https://i.pravatar.cc/150?u=client1`, email: 'juan.cliente@email.com', phone: '04121234567', emailValidated: true, phoneValidated: false, isGpsActive: true, gallery: [], credicoraLevel: 1, credicoraLimit: 150, idVerificationStatus: 'pending', idDocumentUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png' },
  { 
    id: 'provider1', 
    name: 'Tecno Soluciones S.A.', 
    type: 'provider', 
    reputation: 4.8, 
    verified: true,
    isGpsActive: true,
    isTransactionsActive: true,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'contacto@tecnosoluciones.com',
    phone: '02129876543',
    emailValidated: true,
    phoneValidated: true,
    promotion: {
      text: 'HOY 10% OFF',
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), 
    },
    profileSetupData: {
      specialty: 'Expertos en Tecnología',
      providerType: 'company',
      offerType: 'product',
      hasPhysicalLocation: true,
      showExactLocation: true,
      acceptsCredicora: true,
      appointmentCost: 50,
      schedule: {
        'Lunes': { from: '00:00', to: '23:59', active: true },
        'Martes': { from: '00:00', to: '23:59', active: true },
        'Miércoles': { from: '00:00', to: '23:59', active: true },
        'Jueves': { from: '00:00', to: '23:59', active: true },
        'Viernes': { from: '00:00', to: '23:59', active: true },
        'Sábado': { from: '00:00', to: '23:59', active: true },
        'Domingo': { from: '00:00', to: '23:59', active: true },
      }
    },
    gallery: [
      { 
        id: 'provider1-img1',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Soporte Técnico", 
        description: "Specialized technical support for computer equipment, both hardware and software. We solve your problems quickly and efficiently.",
        comments: [
          { author: "Mario Gómez", text: "They solved my problem in minutes. Excellent!" },
          { author: "Laura Mendez", text: "Very friendly and efficient." },
        ]
      },
      { 
        id: 'provider1-img2',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Instalación de Redes", 
        description: "Installation and configuration of wired and wireless networks for offices and homes. We optimize the coverage and security of your connection.",
        comments: []
      },
      { 
        id: 'provider1-img3',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Venta de Equipos", 
        description: "The best equipment and components for your needs. Personalized advice so you make the best investment.",
         comments: [
          { author: "Pedro R.", text: "I found everything I was looking for at a good price." },
        ]
      },
       { 
        id: 'provider1-img4',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Mantenimiento Preventivo", 
        description: "Preventive maintenance plans for companies. Ensure the continuity of your operations and extend the useful life of your equipment.",
        comments: []
      },
    ]
  },
  { 
    id: 'provider2', 
    name: 'Ana Rivas - Plomería', 
    type: 'provider', 
    reputation: 4.2,
    isGpsActive: false,
    isTransactionsActive: true,
    isPaused: true,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'servicios@hogarfeliz.com',
    phone: '04149876543',
    emailValidated: true,
    phoneValidated: false,
    profileSetupData: {
      specialty: 'Plomería y reparaciones del hogar',
      providerType: 'professional',
      offerType: 'service',
      hasPhysicalLocation: true,
      showExactLocation: false,
      acceptsCredicora: false,
      appointmentCost: 0,
      schedule: {
        'Lunes': { from: '09:00', to: '17:00', active: true },
        'Martes': { from: '09:00', to: '17:00', active: true },
        'Miércoles': { from: '09:00', to: '17:00', active: true },
        'Jueves': { from: '09:00', to: '17:00', active: true },
        'Viernes': { from: '09:00', to: '17:00', active: true },
        'Sábado': { from: '10:00', to: '14:00', active: true },
        'Domingo': { from: '00:00', to: '00:00', active: false },
      }
    },
    gallery: [
      { 
        id: 'provider2-img1',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Limpieza Profunda", 
        description: "Detailed description of the deep cleaning service for kitchens, bathrooms, and common areas. We leave your home sparkling.",
        comments: [
          { author: "Ana Pérez", text: "The best service! My house was spotless." },
          { author: "Carlos Ruiz", text: "Very professional and punctual. I recommend them." },
        ]
      },
      { 
        id: 'provider2-img2',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Armado de Muebles", 
        description: "Installation and assembly of all types of furniture. Fast, clean, and guaranteed work, with no leftover screws.",
        comments: []
      },
      { 
        id: 'provider2-img3',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Jardinería", 
        description: "Gardening and maintenance service for green areas. Design, pruning, irrigation, and pest control to have the garden of your dreams.",
         comments: [
          { author: "Luisa F.", text: "My garden has never looked so good." },
        ]
      },
      { 
        id: 'provider2-img4',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Reparaciones Eléctricas", 
        description: "Minor electrical repairs, such as changing outlets, switches, and lamps. Safety and quality guaranteed." 
      },
      { 
        id: 'provider2-img5',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Plomería de Emergencia", 
        description: "Emergency plumbing for leaks and blockages. 24-hour service to solve your problems instantly." 
      },
    ]
  },
  { 
    id: 'provider3', 
    name: 'Diseño Creativo', 
    type: 'provider', 
    reputation: 4.9, 
    verified: true,
    isGpsActive: false,
    profileSetupData: {
      providerType: 'professional',
      acceptsCredicora: true,
    },
    gallery: [
      { 
        id: 'provider3-img1',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Diseño de Logos", 
        description: "Creation of modern and memorable logos. We develop a unique visual identity that represents the values of your brand.",
        comments: [
          { author: "Empresa XYZ", text: "The logo exceeded our expectations. Great job!" }
        ]
      },
      { 
        id: 'provider3-img2',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Branding Corporativo", 
        description: "Development of a complete brand identity: logos, color palette, typography, and brand manual for consistent communication.",
        comments: []
      },
    ]
  },
  { 
    id: 'provider4', 
    name: 'Auto Fix Express', 
    type: 'provider', 
    reputation: 4.7, 
    verified: true,
    isGpsActive: true,
    profileSetupData: {
      providerType: 'company',
      hasPhysicalLocation: true,
      showExactLocation: true,
      schedule: {
        'Lunes': { from: '08:00', to: '18:00', active: true },
        'Martes': { from: '08:00', to: '18:00', active: true },
        'Miércoles': { from: '08:00', to: '18:00', active: true },
        'Jueves': { from: '08:00', to: '18:00', active: true },
        'Viernes': { from: '08:00', to: '18:00', active: true },
        'Sábado': { from: '09:00', to: '13:00', active: true },
        'Domingo': { from: '00:00', to: '00:00', active: false },
      }
    },
    gallery: []
  },
    { 
    id: 'provider5', 
    name: 'Gastro Bar El Sabor', 
    type: 'provider', 
    reputation: 4.9, 
    verified: true,
    isGpsActive: true,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'reservas@elsabor.com',
    phone: '02123334455',
    emailValidated: true,
    phoneValidated: true,
    profileSetupData: {
      providerType: 'company',
      hasPhysicalLocation: true,
      showExactLocation: true,
      schedule: {
        'Lunes': { from: '12:00', to: '23:00', active: false },
        'Martes': { from: '12:00', to: '23:00', active: true },
        'Miércoles': { from: '12:00', to: '23:00', active: true },
        'Jueves': { from: '12:00', to: '23:00', active: true },
        'Viernes': { from: '12:00', to: '01:00', active: true },
        'Sábado': { from: '12:00', to: '01:00', active: true },
        'Domingo': { from: '12:00', to: '22:00', active: true },
      }
    },
    gallery: []
  },
];

export const products: Product[] = [
  {
    id: 'prod1',
    name: 'Laptop Pro 15"',
    description: 'Powerful laptop for professionals and creatives.',
    price: 1200,
    category: 'Technology',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'prod2',
    name: 'Advanced Smartphone',
    description: 'The latest model with a high-resolution camera.',
    price: 800,
    category: 'Technology',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'prod3',
    name: 'Basic Tool Kit',
    description: 'Everything you need for home repairs.',
    price: 75,
    category: 'Home',
    providerId: 'provider2',
    imageUrl: 'https://placehold.co/600x400.png',
  },
    {
    id: 'prod4',
    name: 'UltraWide Monitor 34"',
    description: 'Expand your work view with this curved monitor.',
    price: 550,
    category: 'Technology',
    providerId: 'provider1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
];

export const services: Service[] = [
  {
    id: 'serv1',
    name: 'Appliance Installation',
    description: 'Professional and safe installation of any appliance.',
    category: 'Home',
    providerId: 'provider2',
  },
  {
    id: 'serv2',
    name: 'Computer Repair',
    description: 'Diagnosis and repair of hardware and software.',
    category: 'Technology',
    providerId: 'provider1',
  },
  {
    id: 'serv3',
    name: 'Graphic Design',
    description: 'Creation of logos, branding, and advertising material.',
    category: 'Design',
    providerId: 'provider3',
  },
  {
    id: 'serv4',
    name: 'General Plumbing',
    description: 'Repair of leaks, installation of faucets, and more.',
    category: 'Home',
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
      serviceName: 'Appliance Installation',
      quote: {
        breakdown: 'Installation of washer and dryer.',
        total: 150.00,
      },
    },
  },
    {
    id: 'txn3',
    type: 'Sistema',
    status: 'Recarga',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 50.00,
    clientId: 'client1',
    details: {
      system: 'Balance recharge through the platform.',
    },
  },
  {
    id: 'txn4',
    type: 'Servicio',
    status: 'Solicitud Pendiente',
    date: new Date().toISOString(),
    amount: 0,
    clientId: 'client1',
    providerId: 'provider3',
    details: {
        serviceName: 'Logo Design for App',
        quoteItems: ['Logo', 'Branding'],
    },
  },
  {
    id: 'txn5',
    type: 'Compra',
    status: 'Finalizado - Pendiente de Pago',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 1200,
    clientId: 'client1',
    providerId: 'provider1',
    details: {
        items: [{ product: products[0], quantity: 1 }],
        serviceName: 'Laptop Pro 15"'
    },
  },
  {
    id: 'txn6-credicora-main',
    type: 'Compra',
    status: 'Pagado', 
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 1140, 
    clientId: 'client1',
    providerId: 'provider1',
    details: {
        items: [{ product: products[0], quantity: 1 }],
        serviceName: 'Initial Purchase: Laptop Pro 15"',
        paymentMethod: 'credicora',
        initialPayment: 1140,
        totalAmount: 1200,
        financedAmount: 60,
    },
  },
  {
    id: 'txn6-credicora-fee1',
    type: 'Sistema',
    status: 'Acuerdo Aceptado - Pendiente de Ejecución',
    date: add(new Date(), { days: 15 }).toISOString(),
    amount: 20, 
    clientId: 'client1',
    providerId: 'provider1',
    details: {
      system: 'Installment 1/3 of Laptop Pro 15" purchase'
    },
  },
   {
    id: 'txn6-credicora-fee2',
    type: 'Sistema',
    status: 'Acuerdo Aceptado - Pendiente de Ejecución',
    date: add(new Date(), { days: 30 }).toISOString(),
    amount: 20, 
    clientId: 'client1',
    providerId: 'provider1',
    details: {
      system: 'Installment 2/3 of Laptop Pro 15" purchase'
    },
  },
   {
    id: 'txn6-credicora-fee3',
    type: 'Sistema',
    status: 'Acuerdo Aceptado - Pendiente de Ejecución',
    date: add(new Date(), { days: 45 }).toISOString(),
    amount: 20, 
    clientId: 'client1',
    providerId: 'provider1',
    details: {
      system: 'Installment 3/3 of Laptop Pro 15" purchase'
    },
  },
];

export const initialConversations: Conversation[] = [
    {
        id: 'convo1',
        participantIds: ['client1', 'provider1'],
        messages: [
            { id: 'msg1', senderId: 'provider1', text: 'Hello Juan, thanks for your purchase. Your Laptop Pro 15" has been shipped.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
            { id: 'msg2', senderId: 'client1', text: 'Excellent! Thank you very much for the speed.', timestamp: new Date(Date.now() - 2 * 24 * 59 * 60 * 1000).toISOString(), type: 'text' },
            { 
              id: 'msg-proposal-1', 
              senderId: 'provider1', 
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              type: 'proposal',
              proposal: {
                title: 'Annual PC Preventive Maintenance',
                description: 'Internal hardware cleaning, software optimization, and security check for 1 desktop computer. It will be done at our premises.',
                amount: 50,
                deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                acceptsCredicora: true,
              },
              isProposalAccepted: false,
            },
        ],
        unreadCount: 1,
    },
    {
        id: 'convo2',
        participantIds: ['client1', 'provider2'],
        messages: [
            { id: 'msg3', senderId: 'provider2', text: 'Good morning, I am writing to confirm the installation quote. Shall we proceed?', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
            { id: 'msg4', senderId: 'client1', text: 'Yes, please. When could you come?', timestamp: new Date(Date.now() - 5 * 24 * 55 * 60 * 1000).toISOString(), type: 'text' },
            { id: 'msg5', senderId: 'provider2', text: 'We can go tomorrow at 10am. Is that okay with you?', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text' },
        ],
        unreadCount: 1,
    },
    {
        id: 'convo3',
        participantIds: ['client1', 'provider3'],
        messages: [
            { id: 'msg6', senderId: 'client1', text: 'Hello, I am interested in a logo for my new venture. Could you give me more information?', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
            { id: 'msg7', senderId: 'provider3', text: 'Of course! Tell me a little about your idea and I will prepare a proposal for you without obligation.', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), type: 'text' },
        ],
        unreadCount: 0,
    }
];
