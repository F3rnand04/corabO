
/**
 * @jest-environment node
 */
import { createPublication, createProduct } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { User, PublicationOwner } from '@/lib/types';
import { ai } from '@/ai/genkit';

// Mockear completamente el módulo de Firestore para un aislamiento total.
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn((db, collection, id) => ({ path: `${collection}/${id}`})), // Mock path for call identification
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// Mockear Genkit para evitar la necesidad de una API Key real en tests unitarios.
jest.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: jest.fn((config, implementation) => implementation),
  },
}));


const mockedGetDoc = getDoc as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;

describe('Publication and Product Flow - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Test de validación de usuario no existente en createProduct.
  test('should throw an error in createProduct if the user document does not exist', async () => {
    // **Justificación Forense:** Este test aísla la primera y más importante validación del flujo:
    // la existencia del usuario. Se asegura de que la función falle de manera rápida y predecible.
    
    // Arrange: Simulamos que `getDoc` no encuentra nada.
    mockedGetDoc.mockResolvedValue({ exists: () => false });

    // Act & Assert: Esperamos que la promesa sea rechazada con el mensaje de error específico.
    await expect(createProduct({
        userId: 'non_existent_user',
        name: 'Fail Product',
        description: 'This should fail',
        price: 99,
        imageDataUri: 'data:image/png;base64,fail',
    })).rejects.toThrow('User not found. Cannot create product for a non-existent user.');
    
    // Verificamos que no se intentó realizar ninguna escritura en la base de datos.
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });

  // Test 2: Prueba de creación de publicación exitosa.
  test('should call setDoc with the correct publication data on success', async () => {
    // Arrange
    const userDataInput: User = {
        id: 'user_valid', name: 'Valid User', profileImage: 'valid.png', type: 'provider',
        email: 'valid@test.com', phone: '', emailValidated: true, phoneValidated: false, isGpsActive: false, reputation: 0,
        profileSetupData: {},
    };
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => userDataInput });

    const publicationInput = {
      userId: 'user_valid',
      description: 'A valid description',
      imageDataUri: 'data:image/png;base64,valid',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    };

    // Act
    await createPublication(publicationInput);

    // Assert
    expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    const createdPublicationData = mockedSetDoc.mock.calls[0][1];
    
    expect(createdPublicationData.providerId).toBe(publicationInput.userId);
    expect(createdPublicationData.description).toBe(publicationInput.description);
    expect(createdPublicationData.src).toBe(publicationInput.imageDataUri);
    expect(createdPublicationData.type).toBe('image');
  });

});
