
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
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
};

jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));

// **FIX:** The path needs to be adjusted based on the test file's new location.
const { getFirestoreDb: mockedGetDb } = require('@/lib/firebase-server');

describe('Publication Flow - Data Resilience Integration Tests', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await getTestEnv();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Test 1: Test de Integridad Referencial
  test('should fail to create a publication for a non-existent user', async () => {
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

    await expect(createPublication(publicationData)).rejects.toThrow(
      'User not found. Cannot create publication for a non-existent user.'
    );
  });
  
  // Test 2: Test de integridad de datos (ya no se usa desnormalización)
  test('should not embed owner data into the public publication document', async () => {
    const userContext = testEnv.authenticatedContext('user_denormalized');
    const db = userContext.firestore();
    mockedGetDb.mockReturnValue(db);

    const specificUser: User = {
        id: 'user_denormalized',
        name: 'John Doe',
        profileImage: 'http://example.com/johndoe.jpg',
        type: 'provider', email: 'john@doe.com', phone: '', emailValidated: true, phoneValidated: false, isGpsActive: true, reputation: 5, effectiveness: 100,
        verified: true,
        profileSetupData: { username: 'john_doe', specialty: 'Denormalization Expert', providerType: 'professional', useUsername: true }
    };
    await setDoc(doc(db, 'users/user_denormalized'), specificUser);

    await createPublication({
      userId: 'user_denormalized',
      description: 'Denormalization test',
      imageDataUri: 'data:image/png;base64,denormalized',
      aspectRatio: 'square' as const,
      type: 'image' as const,
    });
    
    const publications = await testEnv.unauthenticatedContext().firestore().collection('publications').get();
    const newPublicationDoc = publications.docs[0];
    const publicationData = newPublicationDoc.data();
    
    expect(publicationData.owner).toBeUndefined();
  });
});
