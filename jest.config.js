
module.exports = {
  preset: 'ts-jest',
  // Se establece 'jsdom' como entorno para soportar tanto tests de UI como de backend.
  testEnvironment: 'jest-environment-jsdom', 
  // Se especifica explícitamente dónde buscar los archivos de prueba.
  roots: ['<rootDir>/tests'], 
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/tests/styleMock.js',
  },
  // SOLUCIÓN: Se modifica transformIgnorePatterns para que Jest transpile el módulo 'yaml'.
  transformIgnorePatterns: [
    '/node_modules/(?!yaml).+\\.js$',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};
