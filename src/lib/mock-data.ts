

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
      username: 'TecnoSoluciones',
      useUsername: true,
      categories: ['Tecnología y Soporte'],
      primaryCategory: 'Tecnología y Soporte',
      specialty: 'Expertos en Tecnología',
      providerType: 'company',
      offerType: 'product',
      hasPhysicalLocation: true,
      showExactLocation: true,
      acceptsCredicora: true,
      appointmentCost: 50,
      location: 'Av. Principal de Las Mercedes, Caracas',
      website: 'https://tecnosoluciones.com',
      schedule: {
        'Lunes': { from: '09:00', to: '18:00', active: true },
        'Martes': { from: '09:00', to: '18:00', active: true },
        'Miércoles': { from: '09:00', to: '18:00', active: true },
        'Jueves': { from: '09:00', to: '18:00', active: true },
        'Viernes': { from: '09:00', to: '18:00', active: true },
        'Sábado': { from: '10:00', to: '15:00', active: true },
        'Domingo': { from: '00:00', to: '00:00', active: false },
      }
    },
    gallery: [
      { 
        id: 'provider1-img1',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Soporte Técnico Especializado", 
        description: "Soporte técnico especializado para equipos de computación, tanto hardware como software. Solucionamos tus problemas de forma rápida y eficiente.",
        comments: [
          { author: "Mario Gómez", text: "Me solucionaron el problema en minutos. ¡Excelentes!" },
          { author: "Laura Mendez", text: "Muy amables y eficientes." },
        ]
      },
      { 
        id: 'provider1-img2',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Instalación de Redes", 
        description: "Instalación y configuración de redes alámbricas e inalámbricas para oficinas y hogares. Optimizamos la cobertura y seguridad de tu conexión.",
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
    isPaused: false,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'ana.rivas.plomeria@email.com',
    phone: '04149876543',
    emailValidated: true,
    phoneValidated: true,
    profileSetupData: {
      username: 'AnaPlomeria',
      useUsername: false,
      categories: ['Hogar y Reparaciones'],
      primaryCategory: 'Hogar y Reparaciones',
      specialty: 'Plomería y reparaciones del hogar',
      providerType: 'professional',
      offerType: 'service',
      hasPhysicalLocation: false,
      showExactLocation: false,
      serviceRadius: 15,
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
        alt: "Reparación de Fugas", 
        description: "Servicio especializado en detección y reparación de todo tipo de fugas de agua. Trabajo garantizado y sin sorpresas.",
        comments: [
          { author: "Ana Pérez", text: "¡El mejor servicio! Resolvió una fuga que otros no pudieron." },
          { author: "Carlos Ruiz", text: "Muy profesional y puntual. La recomiendo." },
        ]
      },
      { 
        id: 'provider2-img2',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Instalación de Grifería", 
        description: "Instalación de grifos, duchas y piezas sanitarias. Acabado limpio y profesional.",
        comments: []
      },
      { 
        id: 'provider2-img3',
        type: 'image',
        src: "https://placehold.co/600x400.png", 
        alt: "Destape de Cañerías", 
        description: "Solución a problemas de obstrucción en cañerías de cocinas, baños y bajantes principales. Usamos equipo moderno que no daña sus tuberías.",
         comments: [
          { author: "Luisa F.", text: "Rápida y efectiva. El drenaje quedó como nuevo." },
        ]
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
    name: 'Instalación de Piezas Sanitarias',
    description: 'Professional and safe installation of any appliance.',
    category: 'Hogar y Reparaciones',
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
