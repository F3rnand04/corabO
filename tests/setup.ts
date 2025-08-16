
// Este archivo se ejecuta antes de cada suite de tests.
// Es ideal para configurar mocks globales o variables de entorno.

// Ya no es necesario mockear el API KEY aquí, ya que los tests de integración
// deberían ejecutarse contra los emuladores sin necesidad de claves reales.
// Los tests unitarios mockearán sus propias dependencias.

// Mock global fetch for tests that require it (e.g., firebase rules-unit-testing)
// This is a basic mock; more complex scenarios might require a more sophisticated one.
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({}) })
) as jest.Mock;
