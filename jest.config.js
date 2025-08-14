
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Mapea los alias de la aplicación para que Jest los entienda
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/tests/styleMock.js',
  },
  // Patrones para encontrar archivos de test
  testMatch: [
    '<rootDir>/src/tests/unit/**/*.test.ts',
    '<rootDir>/src/tests/integration/**/*.test.ts',
    '<rootDir>/src/tests/load-tests/**/*.k6.js',
  ],
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
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  // Asegura que Jest busque módulos en la carpeta node_modules raíz
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};
