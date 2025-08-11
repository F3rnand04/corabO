
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Mapea los alias de la aplicación para que Jest los entienda
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Ignora las carpetas que no contienen tests
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  // Configuración para transformar archivos de TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Archivo de setup global para los tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
