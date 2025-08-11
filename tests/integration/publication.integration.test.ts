
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { createPublication } from '@/ai/flows/publication-flow';
import type { User } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuración del Entorno de Pruebas de Integración ---

// ID del proyecto de Firebase, debe ser único para el emulador.
const PROJECT_ID = 'corabo-demo-test';

// Función para obtener el entorno de pruebas de Firestore
const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      // Usamos las reglas de seguridad reales para probarlas
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
};

// Mockeamos la función de la librería para que use el emulador en lugar de la BD real
jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));

const { getFirestoreDb } = require('@/lib/firebase-server');

describe('Publication Flow - Integration Tests', () => {
  let testEnv: RulesTestEnvironment;

  // --- Ciclo de Vida de los Tests ---

  // Antes de todos los tests, inicializamos el emulador de Firestore
  beforeAll(async () => {
    testEnv = await getTestEnv();
  });

  // Después de todos los tests, limpiamos el entorno para evitar efectos secundarios
  afterAll(async () => {
    await testEnv.cleanup();
  });

  // Antes de cada test, limpiamos los datos de la base de datos del emulador
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // --- Tests ---

  // Test de Integración 1: Flujo completo de creación de publicación
  test('should create a gallery item and a public publication document in Firestore', async () => {
    // **Justificación:** Este es el test de integración más importante. No solo prueba que el flujo
    // `createPublication` se ejecuta, sino que verifica el resultado final en la "base de datos"
    // (el emulador). Confirma que tanto la publicación privada en la galería del usuario como la
    // publicación pública para el feed se crean correctamente.

    // Arrange: Configuramos el estado inicial en el emulador
    const userContext = testEnv.authenticatedContext('user123');
    const db = userContext.firestore();
    getFirestoreDb.mockReturnValue(db); // Hacemos que nuestro flujo use la BD del emulador

    const testUser: User = {
        id: 'user123',
        name: 'Test Provider',
        profileImage: 'test.jpg',
        type: 'provider',
        email: 'provider@test.com',
        phone: '123',
        emailValidated: true,
        phoneValidated: true,
        isGpsActive: true,
        reputation: 5,
        profileSetupData: { username: 'test_provider', specialty: 'Testing' }
    };
    await setDoc(doc(db, 'users/user123'), testUser);

    const publicationData = {
        userId: 'user123',
        description: 'Una publicación de integración',
        imageDataUri: 'data:image/png;base64,test_integration',
        aspectRatio: 'square' as const,
        type: 'image' as const,
    };

    // Act: Ejecutamos el flujo
    await createPublication(publicationData);

    // Assert: Verificamos los documentos en la base de datos del emulador
    // Primero, buscamos el ID de la nueva publicación (es dinámico)
    const publications = await testEnv.unauthenticatedContext().firestore().collection('publications').get();
    const newPublicationDoc = publications.docs[0];
    expect(newPublicationDoc).toBeDefined();
    
    // Verificamos que el documento de la publicación pública existe y tiene los datos correctos
    const publicPublication = (await getDoc(doc(db, 'publications', newPublicationDoc.id))).data();
    expect(publicPublication).toBeDefined();
    expect(publicPublication?.description).toBe('Una publicación de integración');
    expect(publicPublication?.owner?.name).toBe('Test Provider');

    // Verificamos que el documento en la galería privada del usuario también existe
    const userGalleryItem = (await getDoc(doc(db, `users/user123/gallery`, newPublicationDoc.id))).data();
    expect(userGalleryItem).toBeDefined();
    expect(userGalleryItem?.description).toBe('Una publicación de integración');
  });

  // Test de Integración 2: Test de Seguridad con Reglas de Firestore
  test('should fail to create a publication if the user is not authenticated', async () => {
    // **Justificación:** Este test valida nuestras reglas de seguridad de Firestore.
    // Simulamos una situación en la que un usuario no autenticado (un atacante) intenta
    // escribir en la base de datos. La prueba debe fallar, demostrando que nuestras reglas
    // protegen la integridad de los datos.

    // Arrange: Usamos un contexto no autenticado
    const unauthedContext = testEnv.unauthenticatedContext();
    const db = unauthedContext.firestore();
    getFirestoreDb.mockReturnValue(db);

    const publicationData = {
        userId: 'attacker',
        description: 'Intento de ataque',
        imageDataUri: 'data:image/png;base64,attack',
        aspectRatio: 'square' as const,
        type: 'image' as const,
    };

    // Act & Assert: Verificamos que la operación falla debido a las reglas de seguridad
    // `assertFails` es una utilidad de la librería de testing de Firebase que comprueba
    // que una promesa sea rechazada con un error de permisos.
    await assertFails(createPublication(publicationData));
  });
});
