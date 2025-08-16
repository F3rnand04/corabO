
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getProfileProducts } from '@/ai/flows/profile-flow';
import { getFirestoreDb } from '@/lib/firebase-server';
import type { GalleryImage, Product, User } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'corabo-demo-test-pagination';

const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: 'localhost',
      port: 8083, // Explicitly set from firebase.json
      rules: fs.readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8'),
    },
  });
};

jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));

const { getFirestoreDb: mockedGetDb } = require('@/lib/firebase-server');

describe('Pagination Flow - Integration Test', () => {
  let testEnv: RulesTestEnvironment;
  const PROVIDER_ID = 'provider_with_products';

  beforeAll(async () => {
    testEnv = await getTestEnv();
    const db = testEnv.unauthenticatedContext().firestore();
    mockedGetDb.mockReturnValue(db);

    // Arrange: Insert 25 product-type publications
    const setupPromises = [];
    for (let i = 1; i <= 25; i++) {
      const publicationId = `pub_prod_${i}`;
      const publication: GalleryImage = {
        id: publicationId,
        providerId: PROVIDER_ID,
        type: 'product',
        src: `image_url_${i}`,
        alt: `Product ${i.toString().padStart(2, '0')}`,
        description: `Test product ${i}`,
        // Firestore uses Timestamps, not ISO strings for ordering
        createdAt: new Date(2024, 0, i).toISOString(),
        productDetails: {
            name: `Product ${i.toString().padStart(2, '0')}`,
            price: 10 + i,
            category: 'Test',
        },
        owner: { // Add dummy owner data as it's part of the type
          id: PROVIDER_ID,
          name: 'Test Provider',
          profileImage: '',
        }
      };
      // Corrected: insert into 'publications' collection
      setupPromises.push(setDoc(doc(db, 'publications', publicationId), publication));
    }
    await Promise.all(setupPromises);
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  // **Justificación Forense:** Este test verifica la lógica de paginación de extremo a extremo.
  // No solo confirma que se devuelven páginas, sino que valida la precisión de los cursores,
  // el tamaño exacto de cada página (incluida la última, que es más pequeña), y que no hay
  // duplicados ni omisiones entre páginas. Esto garantiza que la experiencia de "scroll infinito"
  // del usuario sea impecable y no se pierdan datos.

  test('should fetch products in precise pages', async () => {
    // 1. Primera Petición: Obtener la primera página
    // The flow now correctly queries and transforms data from 'publications'
    const page1Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10 });
    
    // Verificación Forense 1: Tamaño exacto de la página
    expect(page1Result.products).toHaveLength(10);
    // Verificación Forense 2: Contenido correcto (el primer y último producto de la página)
    // Remember to check against the transformed `Product` type
    expect(page1Result.products[0].name).toBe('Product 25'); // Ordered by date descending
    expect(page1Result.products[9].name).toBe('Product 16');
    // Verificación Forense 3: El cursor para la siguiente página debe existir
    expect(page1Result.lastVisibleDocId).toBeDefined();

    // 2. Segunda Petición: Usar el cursor para obtener la segunda página
    const page2Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10, startAfterDocId: page1Result.lastVisibleDocId });

    // Verificación Forense 4: Tamaño exacto de la segunda página
    expect(page2Result.products).toHaveLength(10);
    // Verificación Forense 5: Contenido correcto y consecutivo
    expect(page2Result.products[0].name).toBe('Product 15');
    expect(page2Result.products[9].name).toBe('Product 06');
    expect(page2Result.lastVisibleDocId).toBeDefined();
    
    // 3. Tercera Petición: Obtener la última página (que es más corta)
    const page3Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10, startAfterDocId: page2Result.lastVisibleDocId });
    
    // Verificación Forense 6: Tamaño exacto de la última página
    expect(page3Result.products).toHaveLength(5);
    // Verificación Forense 7: Contenido correcto hasta el final
    expect(page3Result.products[0].name).toBe('Product 05');
    expect(page3Result.products[4].name).toBe('Product 01');
    // Verificación Forense 8: El cursor debe ser nulo o indefinido, indicando el fin de la colección
    expect(page3Result.lastVisibleDocId).toBeUndefined();
  });
});
