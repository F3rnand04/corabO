
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createPublication } from '@/ai/flows/publication-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import type { User } from '@/lib/types';
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
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
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
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Test 1: Resiliencia ante Datos Incompletos
  test('should succeed creating a publication for a user with an incomplete profile', async () => {
    // **Justificación Forense:** Este test es vital para la estabilidad. Valida que nuestro código defensivo
    // (con valores de respaldo) funciona en un entorno de base de datos real. Al omitir `profileSetupData`,
    // forzamos al flujo a usar los fallbacks, asegurando que un usuario nuevo o con datos parciales
    // no pueda romper el sistema al crear contenido.
    
    // Arrange: Creamos un usuario con datos mínimos en el emulador.
    const userContext = testEnv.authenticatedContext('user_incomplete');
    const db = userContext.firestore();
    mockedGetDb.mockReturnValue(db);

    const incompleteUser: User = {
      id: 'user_incomplete',
      name: 'Incomplete User',
      profileImage: 'default.jpg',
      type: 'provider',
      email: 'incomplete@test.com',
      phone: '',
      emailValidated: true,
      phoneValidated: false,
      isGpsActive: false,
      reputation: 0,
      profileSetupData: {}, // Explicitly set as empty for clarity
    };
    await setDoc(doc(db, 'users/user_incomplete'), incompleteUser);

    const publicationData = {
      userId: 'user_incomplete',
      description: 'Test resilience',
      imageDataUri: 'data:image/png;base64,resilience',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    };

    // Act & Assert: Verificamos que la operación tiene éxito gracias al código defensivo.
    await assertSucceeds(createPublication(publicationData));
  });

  // Test 2: Test de Integridad Referencial
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
  
  // Test 3: Test de Integridad de Desnormalización
  test('should embed correct owner data into the public publication document', async () => {
    // **Justificación Forense:** La desnormalización es una optimización potente, pero riesgosa si los datos
    // se desincronizan. Este test verifica que la "instantánea" de los datos del autor que se incrusta
    // en la publicación es una copia exacta del documento original del usuario en el momento de la creación.
    
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
    
    // Assert: Verificamos los datos incrustados.
    const publications = await testEnv.unauthenticatedContext().firestore().collection('publications').get();
    const newPublicationDoc = publications.docs[0];
    const publicationOwnerData = newPublicationDoc.data().owner;
    
    // Verificación forense campo por campo.
    expect(publicationOwnerData.id).toBe(specificUser.id);
    expect(publicationOwnerData.name).toBe(specificUser.profileSetupData?.username); // Verifica que usa el username
    expect(publicationOwnerData.profileImage).toBe(specificUser.profileImage);
    expect(publicationOwnerData.verified).toBe(specificUser.verified);
    expect(publicationOwnerData.profileSetupData.specialty).toBe(specificUser.profileSetupData?.specialty);
  });
});
