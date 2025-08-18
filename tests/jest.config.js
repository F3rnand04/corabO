
module.exports = {
  preset: 'ts-jest',
  // Se establece 'jsdom' como entorno para soportar tanto tests de UI como de backend.
  testEnvironment: 'jest-environment-jsdom', 
  // Se especifica explícitamente dónde buscar los archivos de prueba.
  roots: ['<rootDir>'], 
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '\\.css$': '<rootDir>/styleMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/../.next/',
    '<rootDir>/../node_modules/',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
};
