
module.exports = {
  preset: 'ts-jest',
  // Se establece 'jsdom' como entorno para soportar tanto tests de UI como de backend.
  testEnvironment: 'jest-environment-jsdom', 
  // Se especifica explícitamente dónde buscar los archivos de prueba.
  roots: ['<rootDir>/tests'], 
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock para archivos CSS, específico para el entorno de pruebas.
    '\\.css$': '<rootDir>/tests/styleMock.js',
  },
  // Ignora la transformación de todos los módulos de node_modules excepto 'yaml'
  transformIgnorePatterns: [
    '/node_modules/(?!yaml)/'
  ],
  // Define cómo transformar diferentes tipos de archivos para Jest.
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.mjs$': 'ts-jest',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
