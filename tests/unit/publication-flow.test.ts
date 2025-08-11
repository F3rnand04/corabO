
import { createPublication } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { User } from '@/lib/types';

// Mockear completamente el módulo de Firestore
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'), // Importa y conserva las exportaciones originales
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Castear los mocks para tener acceso a los métodos de jest
const mockedGetDoc = getDoc as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;

describe('Publication Flow - Unit Tests', () => {

  beforeEach(() => {
    // Resetea los mocks antes de cada test para asegurar un estado limpio
    jest.clearAllMocks();
  });

  // Test 1: Caso Positivo - Crear una publicación con un perfil de usuario completo
  test('should create a publication successfully for a user with a complete profile', async () => {
    // **Justificación:** Esta es la prueba del "camino feliz". Valida que si todos los datos son correctos,
    // el flujo funciona como se espera. Es fundamental para asegurar la funcionalidad básica.

    // Arrange: Preparamos los datos de entrada
    const mockUserInput: User = {
      id: 'user123',
      name: 'Juan',
      profileImage: 'http://example.com/img.png',
      type: 'provider',
      email: 'juan@test.com',
      phone: '12345',
      emailValidated: true,
      phoneValidated: true,
      isGpsActive: true,
      reputation: 5,
      profileSetupData: {
        useUsername: true,
        username: 'juan_dev',
        specialty: 'Web Developer',
        providerType: 'professional',
      },
    };
    
    // Simulamos que getDoc devuelve el usuario que hemos creado
    mockedGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserInput,
    });

    const publicationData = {
      userId: 'user123',
      description: 'Esta es una publicación de prueba',
      imageDataUri: 'data:image/png;base64,test',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    };

    // Act: Ejecutamos la función a probar
    await createPublication(publicationData);

    // Assert: Verificamos los resultados esperados
    const commitMock = mockedWriteBatch().commit;
    
    // **Aserción Clave:** Verificamos que el método commit() del batch fue llamado exactamente una vez.
    // Esto nos asegura que la transacción a la base de datos fue intentada.
    expect(commitMock).toHaveBeenCalledTimes(1);
    
    // console.log(mockedWriteBatch().set.mock.calls); // Para depurar y ver con qué datos se llamó a `set`
  });

  // Test 2: Caso Defensivo - Crear una publicación con un perfil de usuario incompleto
  test('should create a publication with default fallbacks for a user with an incomplete profile', async () => {
    // **Justificación:** Este test es CRÍTICO. Aborda directamente el "fallo silencioso" que encontramos.
    // Asegura que el sistema es resiliente y no falla si un usuario no ha completado todo su perfil.
    // Esto garantiza la estabilidad de la función de creación de contenido.

    // Arrange: Preparamos un usuario al que le falta 'profileSetupData'
    const mockUserInput: User = {
      id: 'user456',
      name: 'Maria',
      profileImage: 'http://example.com/img2.png',
      type: 'provider',
      email: 'maria@test.com',
      phone: '67890',
      emailValidated: true,
      phoneValidated: true,
      isGpsActive: true,
      reputation: 4,
      // profileSetupData está ausente a propósito
    };

    mockedGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserInput,
    });

    const publicationData = {
      userId: 'user456',
      description: 'Publicación con perfil incompleto',
      imageDataUri: 'data:image/png;base64,test2',
      aspectRatio: 'vertical' as const,
      type: 'image' as const,
    };

    // Act: Ejecutamos la función
    await createPublication(publicationData);

    // Assert: Verificamos que, a pesar de los datos incompletos, la operación continúa
    const commitMock = mockedWriteBatch().commit;
    
    // **Aserción Clave:** A pesar del perfil incompleto, la operación debe completarse.
    // Esto prueba que nuestro código defensivo (con valores por defecto) funciona.
    expect(commitMock).toHaveBeenCalledTimes(1);
  });

  // Test 3: Caso Negativo - Intentar crear una publicación para un usuario que no existe
  test('should throw an error when trying to create a publication for a non-existent user', async () => {
    // **Justificación:** Esta prueba de seguridad y de integridad de datos asegura que no se puedan crear
    // publicaciones "huérfanas" en el sistema. Valida que nuestras comprobaciones iniciales funcionan.

    // Arrange: Simulamos que getDoc no encuentra ningún usuario
    mockedGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const publicationData = {
      userId: 'non_existent_user',
      description: 'Esto no debería crearse',
      imageDataUri: 'data:image/png;base64,test3',
      aspectRatio: 'horizontal' as const,
      type: 'image' as const,
    };

    // Act & Assert: Verificamos que la función lanza un error como se espera
    // Usamos `expect().rejects.toThrow()` para manejar promesas que deben ser rechazadas.
    await expect(createPublication(publicationData)).rejects.toThrow(
      'User not found. Cannot create publication for a non-existent user.'
    );
  });
});
