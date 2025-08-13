
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Mapea los alias de la aplicación para que Jest los entienda
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Patrones para encontrar archivos de test
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
  ],
  // Ignora las carpetas que no contienen tests
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/security/',
  ],
  // Configuración para transformar archivos de TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Archivo de setup global para los tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
