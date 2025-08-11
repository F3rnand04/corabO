
// Este archivo se ejecuta antes de cada suite de tests.
// Es ideal para configurar mocks globales o variables de entorno.

// Mockea las variables de entorno para los tests
// En una aplicación real, usarías un archivo .env.test
process.env.GEMINI_API_KEY = 'test_api_key';

// Mockea la librería de Firebase para evitar llamadas reales a la BD en tests unitarios
jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(() => ({
    // Aquí puedes simular una instancia de Firestore si es necesario para ciertos tests
  })),
}));
