/**
 * @fileOverview Centralized options for forms and selectors.
 * This helps with internationalization and easier management of static data.
 */

import type { CredicoraLevel, Gift } from '@/lib/types';


export const venezuelanBanks: string[] = [
    "Banco de Venezuela",
    "Banesco",
    "Banco Mercantil",
    "Banco Provincial",
    "BOD",
    "BNC",
    "Banco del Tesoro",
    "Bicentenario Banco Universal",
    "Banplus",
    "Bancaribe",
    "Banco Sofitasa",
    "Banco Plaza",
    "100% Banco",
    "Mi Banco",
    "Bancrecer",
    "Otros"
];

export const allCategories: { id: string; name: string; description: string }[] = [
  { id: 'Hogar y Reparaciones', name: 'Hogar y Reparaciones', description: 'Plomería, electricidad, jardinería...' },
  { id: 'Tecnología y Soporte', name: 'Tecnología y Soporte', description: 'Reparación de PC, redes, diseño...' },
  { id: 'Automotriz y Repuestos', name: 'Automotriz y Repuestos', description: 'Mecánica, repuestos, latonería...' },
  { id: 'Alimentos y Restaurantes', name: 'Alimentos y Restaurantes', description: 'Restaurantes, catering, mercados...' },
  { id: 'Transporte y Asistencia', name: 'Transporte y Asistencia', description: 'Grúas, ambulancias, fletes, mudanzas...' },
  { id: 'Salud y Bienestar', name: 'Salud y Bienestar', description: 'Fisioterapia, nutrición, entrenadores...' },
  { id: 'Turismo y Estadías', name: 'Turismo y Estadías', description: 'Hoteles, posadas, tours, paquetes...' },
  { id: 'Educación', name: 'Educación', description: 'Tutorías, clases, cursos...' },
  { id: 'Eventos', name: 'Eventos', description: 'Fotografía, catering, música...' },
  { id: 'Belleza', name: 'Belleza', description: 'Peluquería, maquillaje, spa...' },
];

export const automotiveServicesOptions: string[] = ["Mecánica General", "Latonería y Pintura", "Cauchera", "Electroauto", "Venta de Repuestos", "Aire Acondicionado"];

export const beautyTradesOptions: string[] = ["Manicure", "Pedicure", "Estilismo", "Maquillaje", "Depilación", "Masajes"];

export const homeRepairTradesOptions: string[] = ["Plomería", "Electricidad", "Albañilería", "Carpintería", "Jardinería", "Pintura"];

export const countries: { code: string; name: string; idLabel: string; companyIdLabel: string; ivaRate: number }[] = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF', ivaRate: 0.16 },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT', ivaRate: 0.19 },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT', ivaRate: 0.19 },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF', ivaRate: 0.21 },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC', ivaRate: 0.16 },
];

export const gifts: Gift[] = [
  { id: 'rose', name: 'Rosa', price: 1, credits: 100, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
  { id: 'diamond', name: 'Diamante', price: 5, credits: 500, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
  { id: 'crown', name: 'Corona', price: 10, credits: 1000, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
];

export const credicoraLevels: Record<string, CredicoraLevel> = {
    '1': {
        level: 1,
        name: 'Alfa',
        color: '210 90% 54%', // blue-500
        creditLimit: 150,
        initialPaymentPercentage: 0.60,
        installments: 3,
        transactionsForNextLevel: 25,
    },
    '2': {
        level: 2,
        name: 'Delta',
        color: '262 84% 58%', // violet-500
        creditLimit: 200,
        initialPaymentPercentage: 0.50,
        installments: 6,
        transactionsForNextLevel: 40,
    },
     '3': {
        level: 3,
        name: 'Lambda',
        color: '322 84% 58%', // pink-500
        creditLimit: 300,
        initialPaymentPercentage: 0.40,
        installments: 9,
        transactionsForNextLevel: 60,
    },
    '4': {
        level: 4,
        name: 'Sigma',
        color: '25 95% 53%', // orange-500
        creditLimit: 600,
        initialPaymentPercentage: 0.30,
        installments: 12,
        transactionsForNextLevel: 80,
    },
    '5': {
        level: 5,
        name: 'Omega',
        color: '45 93% 47%', // yellow-600 (gold)
        creditLimit: 1000,
        initialPaymentPercentage: 0.0,
        installments: 18,
        transactionsForNextLevel: 150,
    },
};

export const credicoraCompanyLevels: Record<string, CredicoraLevel> = {
    '1': {
        level: 1,
        name: 'Bronce',
        color: '27 54% 33%', // SaddleBrown
        creditLimit: 500,
        initialPaymentPercentage: 0.50,
        installments: 4,
        transactionsForNextLevel: 50,
    },
    '2': {
        level: 2,
        name: 'Plata',
        color: '220 13% 69%', // Silver
        creditLimit: 750,
        initialPaymentPercentage: 0.45,
        installments: 8,
        transactionsForNextLevel: 75,
    },
     '3': {
        level: 3,
        name: 'Oro',
        color: '45 93% 47%', // gold
        creditLimit: 1000,
        initialPaymentPercentage: 0.35,
        installments: 12,
        transactionsForNextLevel: 100,
    },
    '4': {
        level: 4,
        name: 'Platino',
        color: '220 13% 91%', // LightGray for Platinum
        creditLimit: 1500,
        initialPaymentPercentage: 0.25,
        installments: 18,
        transactionsForNextLevel: 150,
    },
    '5': {
        level: 5,
        name: 'Diamante',
        color: '207 90% 54%', // blue-500 for Diamond
        creditLimit: 2000,
        initialPaymentPercentage: 0.20,
        installments: 24, // 12 months * 2 bi-weekly
        transactionsForNextLevel: 250,
    },
};

  