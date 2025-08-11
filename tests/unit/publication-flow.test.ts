
import { createPublication } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { User, PublicationOwner } from '@/lib/types';

// Mockear completamente el módulo de Firestore para un aislamiento total.
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockedGetDoc = getDoc as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedSet = mockedWriteBatch().set as jest.Mock;

describe('Publication Flow - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Resiliencia ante un perfil de usuario parcialmente incompleto.
  test('should use fallback values for owner data when profileSetupData is missing', async () => {
    // **Justificación Forense:** Este test unitario aísla el objeto `ownerData`. Se asegura de que,
    // incluso si `profileSetupData` es nulo o indefinido, la función no falle. En su lugar, debe
    // recurrir a valores de respaldo seguros (como `user.name` en lugar de `user.profileSetupData.username`).
    // Esto previene un `TypeError` fatal en el servidor.
    
    // Arrange: Creamos un usuario sin `profileSetupData`.
    const incompleteUser: User = {
      id: 'user_no_setup',
      name: 'Generic User',
      profileImage: 'generic.png',
      type: 'provider',
      email: 'generic@test.com',
      phone: '',
      emailValidated: true,
      phoneValidated: false,
      isGpsActive: false,
      reputation: 0,
      verified: false
    };

    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => incompleteUser });

    // Act: Ejecutamos el flujo.
    await createPublication({
      userId: 'user_no_setup',
      description: 'Test with no profile setup',
      imageDataUri: 'data:image/png;base64,test',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    });

    // Assert: Verificamos que la llamada a `batch.set` para la publicación pública (`publications`)
    // contiene un objeto `owner` con los valores de respaldo correctos.
    const publicPublicationCall = mockedSet.mock.calls.find(call => call[0].path.startsWith('publications/'));
    const ownerData: PublicationOwner = publicPublicationCall[1].owner;

    expect(ownerData.name).toBe(incompleteUser.name); // ¡Aserción clave! Debe usar el nombre base.
    expect(ownerData.profileImage).toBe(incompleteUser.profileImage);
    expect(ownerData.verified).toBe(false);
    expect(ownerData.profileSetupData?.specialty).toBe(''); // Fallback a string vacía.
    expect(ownerData.profileSetupData?.providerType).toBe('professional'); // Fallback a 'professional'.
  });

  // Test 2: Prueba de validación de usuario no existente.
  test('should throw an error if the user document does not exist', async () => {
    // **Justificación Forense:** Este test aísla la primera y más importante validación del flujo:
    // la existencia del usuario. Se asegura de que la función falle de manera rápida y predecible
    // si no se encuentra el usuario, evitando procesamientos innecesarios y protegiendo la integridad
    // de los datos al no permitir la creación de contenido "huérfano".
    
    // Arrange: Simulamos que `getDoc` no encuentra nada.
    mockedGetDoc.mockResolvedValue({ exists: () => false });

    // Act & Assert: Esperamos que la promesa sea rechazada con el mensaje de error específico.
    await expect(createPublication({
      userId: 'non_existent_user',
      description: 'This should fail',
      imageDataUri: 'data:image/png;base64,fail',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    })).rejects.toThrow('User not found. Cannot create publication for a non-existent user.');
    
    // Verificamos que no se intentó realizar ninguna escritura en la base de datos.
    expect(mockedWriteBatch().commit).not.toHaveBeenCalled();
  });
});
