
// Este archivo se ejecuta antes de cada suite de tests.
// Es ideal para configurar mocks globales o variables de entorno.

// FIX: Add a global fetch mock.
// This is required by firebase-rules-unit-testing to communicate with the emulator.
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''), // Add a text() method to the mock response
  })
) as jest.Mock;


// Mockea las variables de entorno para los tests
// En una aplicación real, usarías un archivo .env.test
process.env.GEMINI_API_KEY = 'test_api_key';
