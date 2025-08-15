
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Mapea los alias de la aplicación para que Jest los entienda
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/tests/styleMock.js',
  },
  // Se elimina testMatch para que Jest use su comportamiento por defecto
  // y encuentre los archivos .test.ts en la carpeta /tests
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
  // Asegura que Jest busque módulos en la carpeta node_modules raíz
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};
