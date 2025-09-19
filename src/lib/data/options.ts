/**
 * @fileOverview Centralized options for forms and selectors.
 * This helps with internationalization and easier management of static data.
 */

export const venezuelanBanks = [
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

export const allCategories = [
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

export const automotiveServicesOptions = ["Mecánica General", "Latonería y Pintura", "Cauchera", "Electroauto", "Venta de Repuestos", "Aire Acondicionado"];

export const beautyTradesOptions = ["Manicure", "Pedicure", "Estilismo", "Maquillaje", "Depilación", "Masajes"];

export const homeRepairTradesOptions = ["Plomería", "Electricidad", "Albañilería", "Carpintería", "Jardinería", "Pintura"];

export const countries = [
  { code: 'VE', name: 'Venezuela', idLabel: 'Cédula de Identidad', companyIdLabel: 'RIF', ivaRate: 0.16 },
  { code: 'CO', name: 'Colombia', idLabel: 'Cédula de Ciudadanía', companyIdLabel: 'NIT', ivaRate: 0.19 },
  { code: 'CL', name: 'Chile', idLabel: 'RUT / DNI', companyIdLabel: 'RUT', ivaRate: 0.19 },
  { code: 'ES', name: 'España', idLabel: 'DNI / NIE', companyIdLabel: 'NIF', ivaRate: 0.21 },
  { code: 'MX', name: 'México', idLabel: 'CURP', companyIdLabel: 'RFC', ivaRate: 0.16 },
];

export const gifts = [
  { id: 'rose', name: 'Rosa', price: 1, credits: 100, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
  { id: 'diamond', name: 'Diamante', price: 5, credits: 500, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
  { id: 'crown', name: 'Corona', price: 10, credits: 1000, icon: 'https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png' },
];
