
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createPublication } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import type { User, PublicationOwner } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuración del Entorno de Pruebas de Integración ---
const PROJECT_ID = 'corabo-demo-test-publication';

const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: 'localhost',
      port: 8083,
      rules: fs.readFileSync(path.resolve(__dirname, '../../src/firestore.rules'), 'utf8'),
    },
  });
};

jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));

const { getFirestoreDb: mockedGetDb } = require('@/lib/firebase-server');

describe('Publication Flow - Data Resilience Integration Tests', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await getTestEnv();
  });

  afterAll(async () => {
    // FIX: Check if testEnv was successfully initialized before cleanup.
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Test 1: Test de Integridad Referencial
  test('should fail to create a publication for a non-existent user', async () => {
    // **Justificación Forense:** Este test de seguridad verifica que no se puedan crear publicaciones
    // "huérfanas" o con datos falsificados. Confirma que el flujo valida la existencia del
    // usuario en la base de datos antes de proceder, protegiendo la integridad de los datos.

    // Arrange: Usamos un contexto autenticado, pero el `userId` en los datos no existe.
    const userContext = testEnv.authenticatedContext('user_ghost');
    const db = userContext.firestore();
    mockedGetDb.mockReturnValue(db);

    const publicationData = {
      userId: 'user_that_does_not_exist',
      description: 'This should fail',
      imageDataUri: 'data:image/png;base64,ghost',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    };

    // Act & Assert: La operación debe fallar porque el `getDoc` dentro del flujo no encontrará al usuario.
    await expect(createPublication(publicationData)).rejects.toThrow(
      'User not found. Cannot create publication for a non-existent user.'
    );
  });
  
  // Test 2: Test de integridad de datos (ya no se usa desnormalización)
  test('should not embed owner data into the public publication document', async () => {
    // **ACTUALIZACIÓN:** La lógica ha cambiado. El campo `owner` ya no se debe incrustar para evitar datos
    // obsoletos. Este test ahora verifica que el campo `owner` NO exista.
    
    // Arrange: Creamos un usuario con datos específicos.
    const userContext = testEnv.authenticatedContext('user_denormalized');
    const db = userContext.firestore();
    mockedGetDb.mockReturnValue(db);

    const specificUser: User = {
        id: 'user_denormalized',
        name: 'John Doe',
        profileImage: 'http://example.com/johndoe.jpg',
        type: 'provider', email: 'john@doe.com', phone: '', emailValidated: true, phoneValidated: false, isGpsActive: true, reputation: 5,
        verified: true,
        profileSetupData: { username: 'john_doe', specialty: 'Denormalization Expert', providerType: 'professional', useUsername: true }
    };
    await setDoc(doc(db, 'users/user_denormalized'), specificUser);

    // Act: Creamos una publicación para este usuario.
    await createPublication({
      userId: 'user_denormalized',
      description: 'Denormalization test',
      imageDataUri: 'data:image/png;base64,denormalized',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    });
    
    // Assert: Verificamos que los datos del 'owner' ya NO están incrustados.
    const publications = await testEnv.unauthenticatedContext().firestore().collection('publications').get();
    const newPublicationDoc = publications.docs[0];
    const publicationData = newPublicationDoc.data();
    
    // Verificación forense: el campo 'owner' debe ser indefinido.
    expect(publicationData.owner).toBeUndefined();
  });
});
