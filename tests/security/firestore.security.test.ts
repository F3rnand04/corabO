
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuración del Entorno de Pruebas de Seguridad ---
const PROJECT_ID = 'corabo-demo-security-test';

const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      // Carga el archivo de reglas de seguridad real para el test
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      // El host y puerto para conectar al emulador local
      host: '127.0.0.1',
      port: 8080,
    },
  });
};

describe('Security Rules for Firestore', () => {
  let testEnv: RulesTestEnvironment;

  // --- Ciclo de Vida del Test ---
  beforeAll(async () => {
    // Inicializa el entorno de pruebas antes de que se ejecuten todos los tests
    testEnv = await getTestEnv();
  });

  afterAll(async () => {
    // Limpia el entorno después de que todos los tests hayan finalizado
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Limpia la base de datos antes de cada test para asegurar un estado limpio
    await testEnv.clearFirestore();
  });

  // --- Caso de Prueba 1: Acceso Permitido ---
  test('should allow an authenticated user to read and write any document', async () => {
    // Contexto: Simula un usuario autenticado con el UID 'user_A'
    const userAContext = testEnv.authenticatedContext('user_A');
    const db = userAContext.firestore();
    const userADocRef = doc(db, 'users/user_A');
    const userBDocRef = doc(db, 'users/user_B');

    // Aserción: La escritura en su propio documento debe tener éxito.
    await assertSucceeds(setDoc(userADocRef, { name: 'User A', email: 'a@test.com' }));
    // Aserción: La lectura de su propio documento debe tener éxito.
    await assertSucceeds(getDoc(userADocRef));
    // Aserción: La escritura en el documento de otro usuario también debe tener éxito con las reglas de desarrollo.
    await assertSucceeds(setDoc(userBDocRef, { name: 'User B', email: 'b@test.com' }));
  });


  // --- Caso de Prueba 2: Acceso No Autenticado ---
  test('should deny an unauthenticated user from accessing any document', async () => {
    // Contexto: Simula un usuario no autenticado (anónimo)
    const unauthenticatedContext = testEnv.unauthenticatedContext();
    const db = unauthenticatedContext.firestore();
    const anyUserDocRef = doc(db, 'users/any_user_id');

    // Aserción: Cualquier intento de escritura por un usuario no autenticado debe fallar.
    await assertFails(setDoc(anyUserDocRef, { name: 'Any User', email: 'any@test.com' }));
    // Aserción: Cualquier intento de lectura por un usuario no autenticado debe fallar.
    await assertFails(getDoc(anyUserDocRef));
  });

   // --- Caso de Prueba 3: Acceso a Colecciones Públicas ---
   test('should allow any authenticated user to write to any collection', async () => {
    const userContext = testEnv.authenticatedContext('user_C');
    const db = userContext.firestore();
    const productDocRef = doc(db, 'products/product_123');

    // Aserción: La escritura en la colección de productos debe tener éxito.
    await assertSucceeds(setDoc(productDocRef, { name: 'Test Product', price: 100 }));
  });

});
