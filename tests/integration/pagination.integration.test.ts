
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
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
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
        createdAt: new Date(2024, 0, i).toISOString(),
        productDetails: {
            name: `Product ${i.toString().padStart(2, '0')}`,
            price: 10 + i,
            category: 'Test',
        },
      };
      setupPromises.push(setDoc(doc(db, 'publications', publicationId), publication));
    }
    await Promise.all(setupPromises);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });
  
  test('should fetch products in precise pages', async () => {
    const page1Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10 });
    
    expect(page1Result.products).toHaveLength(10);
    expect(page1Result.products[0].name).toBe('Product 25');
    expect(page1Result.products[9].name).toBe('Product 16');
    expect(page1Result.lastVisibleDocId).toBeDefined();

    const page2Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10, startAfterDocId: page1Result.lastVisibleDocId! });

    expect(page2Result.products).toHaveLength(10);
    expect(page2Result.products[0].name).toBe('Product 15');
    expect(page2Result.products[9].name).toBe('Product 06');
    expect(page2Result.lastVisibleDocId).toBeDefined();
    
    const page3Result = await getProfileProducts({ userId: PROVIDER_ID, limitNum: 10, startAfterDocId: page2Result.lastVisibleDocId! });
    
    expect(page3Result.products).toHaveLength(5);
    expect(page3Result.products[0].name).toBe('Product 05');
    expect(page3Result.products[4].name).toBe('Product 01');
    expect(page3Result.lastVisibleDocId).toBeUndefined();
  });
});
