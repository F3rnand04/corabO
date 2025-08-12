
import { createPublication, createProduct } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { User, PublicationOwner } from '@/lib/types';

// Mockear completamente el módulo de Firestore para un aislamiento total.
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn((db, collection, id) => ({ path: `${collection}/${id}`})), // Mock path for call identification
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockedGetDoc = getDoc as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedSet = mockedWriteBatch().set as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;

describe('Publication and Product Flow - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Resiliencia ante un perfil de usuario parcialmente incompleto en createPublication.
  test('should use fallback values for owner data when profileSetupData is missing', async () => {
    // **Justificación Forense:** Este test unitario aísla el objeto `ownerData`. Se asegura de que,
    // incluso si `profileSetupData` es nulo o indefinido, la función no falle. En su lugar, debe
    // recurrir a valores de respaldo seguros.
    
     const ownerDataInput: PublicationOwner = {
        id: 'user_no_setup',
        name: 'Generic User',
        profileImage: 'generic.png',
        verified: false,
        isGpsActive: false,
        reputation: 0,
        // `profileSetupData` se omite deliberadamente.
        profileSetupData: {},
    };
    
    // Arrange: Simulamos que `getDoc` devuelve un usuario válido
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => ownerDataInput });


    // Act: Ejecutamos el flujo.
    await createPublication({
      userId: 'user_no_setup',
      description: 'Test with no profile setup',
      imageDataUri: 'data:image/png;base64,test',
      aspectRatio: 'square' as const,
      type: 'image' as const,
      owner: ownerDataInput,
    });

    // Assert: Verificamos que la llamada a `batch.set` para la publicación pública
    const publicPublicationCall = mockedSetDoc.mock.calls.find(call => call[0].path.startsWith('publications/'));
    const ownerDataResult: PublicationOwner = publicPublicationCall[1].owner;

    expect(ownerDataResult.name).toBe(ownerDataInput.name);
    expect(ownerDataResult.profileImage).toBe(ownerDataInput.profileImage);
    expect(ownerDataResult.verified).toBe(false);
  });

  // Test 2: Prueba de validación de usuario no existente en createProduct.
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

  // Test 3: Test de Integridad de Desnormalización para Productos.
  test('should embed correct owner data when creating a product', async () => {
    // **Justificación Forense:** La desnormalización es una optimización potente, pero riesgosa.
    // Este test verifica que la "instantánea" de los datos del autor que se incrusta en la
    // publicación de tipo producto es una copia exacta del documento original del usuario.
    
    // Arrange: Creamos un usuario con datos específicos.
    const specificUser: User = {
        id: 'user_product_creator',
        name: 'Jane Doe',
        profileImage: 'http://example.com/janedoe.jpg',
        type: 'provider', email: 'j@d.com', phone: '', emailValidated: true, phoneValidated: false, isGpsActive: true, reputation: 4, verified: true,
        profileSetupData: { username: 'jane_doe_shop', specialty: 'Product Seller', providerType: 'company' }
    };
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => specificUser });

    // Act: Creamos un producto para este usuario.
    await createProduct({
        userId: 'user_product_creator',
        name: 'Test Product',
        description: 'A product for testing',
        price: 123,
        imageDataUri: 'data:image/png;base64,product_test',
    });
    
    // Assert: Verificamos los datos del `owner` incrustados.
    const createdProductData = mockedSetDoc.mock.calls[0][1];
    const ownerData: PublicationOwner = createdProductData.owner;
    
    expect(ownerData.id).toBe(specificUser.id);
    expect(ownerData.name).toBe(specificUser.profileSetupData?.username); // Verifica que usa el username
    expect(ownerData.profileImage).toBe(specificUser.profileImage);
    expect(ownerData.verified).toBe(specificUser.verified);
  });
});
