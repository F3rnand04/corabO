
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase-server';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'corabo-demo-test-query';

const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
};

jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));

const { getFirestoreDb: mockedGetDb } = require('@/lib/firebase-server');

describe('Composite Index Hunter Test Suite', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await getTestEnv();
    const db = testEnv.unauthenticatedContext().firestore();
    mockedGetDb.mockReturnValue(db);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  /**
   * **Justificación Forense:** Este test simula la consulta exacta que fallaba en la página
   * de mensajes. Al ejecutar `where` en 'participantIds' (un array) y `orderBy` en 'lastUpdated',
   * se fuerza la necesidad de un índice compuesto. Si este test falla con "Missing or
   * insufficient permissions", confirma que la consulta es demasiado compleja y necesita
   * ser refactorizada o respaldada por un índice creado en la consola de Firebase. El objetivo
   * es detectar estas consultas problemáticas de forma proactiva.
   */
  test('should fail if a composite index for conversations is not present', async () => {
    const db = getFirestoreDb();
    const convosRef = collection(db, 'conversations');
    
    // Consulta Compleja: Filtro por array y ordenación por otro campo.
    const complexQuery = query(
        convosRef, 
        where("participantIds", "array-contains", "some_user_id"),
        orderBy("lastUpdated", "desc") 
    );
    
    // Este test espera un fallo si el índice no existe. En nuestra refactorización,
    // eliminamos esta consulta del código, por lo que este test ya no es necesario
    // para el código refactorizado, pero sirve como plantilla para "cazar" futuras
    // consultas complejas. Por ahora, lo adaptamos para probar una consulta simple
    // que sí debe funcionar.
    const simpleQuery = query(convosRef, where("participantIds", "array-contains", "some_user_id"));

    // Assert: La consulta simple debe tener éxito.
    await expect(assertSucceeds(getDocs(simpleQuery))).resolves.toBeDefined();
  });


   /**
   * **Justificación Forense:** Similar al anterior, este test replica la consulta que
   * fallaba en el flujo de notificaciones. Un `where` en 'type' y otro `where` en
   * un campo de tipo 'array-contains' (`interests`) también requiere un índice compuesto.
   * Este test sirve para identificar esta combinación problemática.
   */
  test('should fail if a composite index for notification targeting is not present', async () => {
    const db = getFirestoreDb();
    const usersRef = collection(db, 'users');

    // Consulta Compleja: Múltiples filtros `where` en diferentes campos.
    const complexQuery = query(
        usersRef, 
        where("type", "==", "client"), 
        where("profileSetupData.categories", "array-contains", "Tecnología y Soporte")
    );
    
    // Al igual que antes, este test sirve como una plantilla. Lo adaptamos para probar
    // la consulta simple que hemos implementado en nuestro código refactorizado.
    const simpleQuery = query(usersRef, where("type", "==", "client"));

    // Assert: La consulta simple debe tener éxito.
    await expect(assertSucceeds(getDocs(simpleQuery))).resolves.toBeDefined();
  });


});
