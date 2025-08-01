

import type { User, Product, Service, Transaction, Conversation } from './types';

export const users: User[] = [
  { id: 'client1', name: 'Juan Cliente', type: 'client', reputation: 4.5, profileImage: `https://i.pravatar.cc/150?u=client1`, email: 'juan.cliente@email.com', phone: '04121234567', emailValidated: true, phoneValidated: false, isGpsActive: true, gallery: [] },
  { 
    id: 'provider1', 
    name: 'Tecno Soluciones S.A.', 
    type: 'provider', 
    reputation: 4.8, 
    verified: true,
    isGpsActive: true,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'contacto@tecnosoluciones.com',
    phone: '02129876543',
    emailValidated: true,
    phoneValidated: true,
    promotion: {
      text: 'HOY 10% OFF',
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Expires in 12 hours
    },
    profileSetupData: {
      hasPhysicalLocation: true,
      showExactLocation: true,
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
        src: "https://placehold.co/600x400.png", 
        alt: "Soporte Técnico", 
        description: "Soporte técnico especializado para equipos de computación, tanto hardware como software. Resolvemos tus problemas con rapidez y eficacia.",
        comments: [
          { author: "Mario Gómez", text: "Resolvieron mi problema en minutos. ¡Excelente!" },
          { author: "Laura Mendez", text: "Muy amables y eficientes." },
        ]
      },
      { 
        id: 'provider1-img2',
        src: "https://placehold.co/600x400.png", 
        alt: "Instalación de Redes", 
        description: "Instalación y configuración de redes cableadas e inalámbricas para oficinas y hogares. Optimizamos la cobertura y seguridad de tu conexión.",
        comments: []
      },
      { 
        id: 'provider1-img3',
        src: "https://placehold.co/600x400.png", 
        alt: "Venta de Equipos", 
        description: "Los mejores equipos y componentes para tus necesidades. Asesoramiento personalizado para que hagas la mejor inversión.",
         comments: [
          { author: "Pedro R.", text: "Conseguí todo lo que buscaba y a buen precio." },
        ]
      },
       { 
        id: 'provider1-img4',
        src: "https://placehold.co/600x400.png", 
        alt: "Mantenimiento Preventivo", 
        description: "Planes de mantenimiento preventivo para empresas. Asegura la continuidad de tus operaciones y alarga la vida útil de tus equipos.",
        comments: []
      },
    ]
  },
  { 
    id: 'provider2', 
    name: 'Hogar Feliz Servicios', 
    type: 'provider', 
    reputation: 4.2,
    isGpsActive: false,
    profileImage: `https://placehold.co/150x150.png`,
    email: 'servicios@hogarfeliz.com',
    phone: '04149876543',
    emailValidated: true,
    phoneValidated: false,
    gallery: [
      { 
        id: 'provider2-img1',
        src: "https://placehold.co/600x400.png", 
        alt: "Limpieza Profunda", 
        description: "Descripción detallada del servicio de limpieza profunda para cocinas, baños y áreas comunes. Dejamos tu hogar reluciente.",
        comments: [
          { author: "Ana Pérez", text: "¡El mejor servicio! Mi casa quedó impecable." },
          { author: "Carlos Ruiz", text: "Muy profesionales y puntuales. Los recomiendo." },
        ]
      },
      { 
        id: 'provider2-img2',
        src: "https://placehold.co/600x400.png", 
        alt: "Armado de Muebles", 
        description: "Instalación y armado de todo tipo de muebles. Trabajo rápido, limpio y garantizado, sin que te sobren tornillos.",
        comments: []
      },
      { 
        id: 'provider2-img3',
        src: "https://placehold.co/600x400.png", 
        alt: "Jardinería", 
        description: "Servicio de jardinería y mantenimiento de áreas verdes. Diseño, poda, riego y control de plagas para que tengas el jardín de tus sueños.",
         comments: [
          { author: "Luisa F.", text: "Mi jardín nunca se había visto tan bien." },
        ]
      },
      { 
        id: 'provider2-img4',
        src: "https://placehold.co/600x400.png", 
        alt: "Reparaciones Eléctricas", 
        description: "Reparaciones eléctricas menores, como cambio de enchufes, interruptores y lámparas. Seguridad y calidad garantizada." 
      },
      { 
        id: 'provider2-img5',
        src: "https://placehold.co/600x400.png", 
        alt: "Plomería de Emergencia", 
        description: "Plomería de emergencia para fugas y obstrucciones. Atención 24 horas para resolver tus problemas al instante." 
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
    profileImage: `https://placehold.co/150x150.png`,
    email: 'hola@disenocreativo.net',
    phone: '04241112233',
    emailValidated: true,
    phoneValidated: true,
    gallery: [
      { 
        id: 'provider3-img1',
        src: "https://placehold.co/600x400.png", 
        alt: "Diseño de Logos", 
        description: "Creación de logos modernos y memorables. Desarrollamos una identidad visual única que representa los valores de tu marca.",
        comments: [
          { author: "Empresa XYZ", text: "El logo superó nuestras expectativas. ¡Gran trabajo!" }
        ]
      },
      { 
        id: 'provider3-img2',
        src: "https://placehold.co/600x400.png", 
        alt: "Branding Corporativo", 
        description: "Desarrollo de identidad de marca completa: logos, paleta de colores, tipografía y manual de marca para una comunicación consistente.",
        comments: []
      },
    ]
  },
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
    name: 'Diseño Gráfico',
    description: 'Creación de logos, branding y material publicitario.',
    category: 'Diseño',
    providerId: 'provider3',
  },
  {
    id: 'serv4',
    name: 'Plomería General',
    description: 'Reparación de fugas, instalación de grifos y más.',
    category: 'Hogar',
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
      system: 'Recarga de saldo a través de la plataforma.',
    },
  },
];

export const initialConversations: Conversation[] = [
    {
        id: 'convo1',
        participantIds: ['client1', 'provider1'],
        messages: [
            { senderId: 'provider1', text: 'Hola Juan, gracias por tu compra. Tu Laptop Pro 15" ha sido enviada.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { senderId: 'client1', text: '¡Excelente! Muchas gracias por la rapidez.', timestamp: new Date(Date.now() - 2 * 24 * 59 * 60 * 1000).toISOString() },
        ],
        unreadCount: 0,
    },
    {
        id: 'convo2',
        participantIds: ['client1', 'provider2'],
        messages: [
            { senderId: 'provider2', text: 'Buenos días, te escribo para confirmar la cotización de la instalación. ¿Procedemos?', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { senderId: 'client1', text: 'Sí, por favor. ¿Cuándo podrían venir?', timestamp: new Date(Date.now() - 5 * 24 * 55 * 60 * 1000).toISOString() },
            { senderId: 'provider2', text: 'Podemos ir mañana a las 10am. ¿Te parece bien?', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
        ],
        unreadCount: 1,
    },
    {
        id: 'convo3',
        participantIds: ['client1', 'provider3'],
        messages: [
            { senderId: 'client1', text: 'Hola, estoy interesado en un logo para mi nuevo emprendimiento. ¿Me podrías dar más información?', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            { senderId: 'provider3', text: '¡Claro que sí! Cuéntame un poco sobre tu idea y te preparo una propuesta sin compromiso.', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
        ],
        unreadCount: 0,
    }
];
