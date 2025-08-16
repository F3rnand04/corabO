
module.exports = {
  preset: 'ts-jest',
  // Se establece 'jsdom' como entorno para soportar tanto tests de UI como de backend.
  testEnvironment: 'jest-environment-jsdom', 
  // Se especifica explícitamente dónde buscar los archivos de prueba.
  roots: ['<rootDir>/src/tests'], 
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/tests/styleMock.js',
  },
  // Use a less restrictive transformIgnorePatterns to allow transforming specific node_modules
  transformIgnorePatterns: ['/node_modules/(?!(yaml)/)'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'ts-jest', // Añadido para transformar archivos .js, incluyendo los de node_modules.
    '^.+\\.mjs$': 'ts-jest', // Add rule for .mjs files often used in node_modules
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};
