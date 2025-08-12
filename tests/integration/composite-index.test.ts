

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { collection, query, where, orderBy, getDocs, setDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuración del Entorno ---
const PROJECT_ID = 'corabo-demo-test-index';

const getTestEnv = async () => {
  return await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
};

describe('Composite Index Verification Test', () => {
  let testEnv: RulesTestEnvironment;

  // --- Ciclo de Vida del Test ---
  beforeAll(async () => {
    testEnv = await getTestEnv();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  /**
   * **Test de Verificación Forense del Índice Compuesto**
   *
   * **Objetivo:** Confirmar que la creación del índice compuesto para la colección `conversations`
   * soluciona el error `Missing or insufficient permissions`.
   *
   * **Proceso:**
   * 1. **Arrange:** Se insertan dos conversaciones de prueba con fechas de actualización distintas.
   * 2. **Act:** Se ejecuta la consulta exacta que antes fallaba: un `where` en un `array-contains`
   *    junto con un `orderBy` en un campo de fecha.
   * 3. **Assert:**
   *    - Se utiliza `assertSucceeds` para verificar que la consulta ya no lanza el error de permisos.
   *    - Se verifica que la consulta devuelve exactamente el número de documentos esperado.
   *    - Se comprueba el orden de los resultados para asegurar que el `orderBy` descendente se aplicó
   *      correctamente gracias al índice.
   */
  test('should succeed executing complex query when composite index exists', async () => {
    // Paso 1: Arrange
    const db = testEnv.unauthenticatedContext().firestore();
    const USER_ID = 'user1';

    // Crear dos conversaciones para 'user1' con fechas diferentes
    const convo1 = {
      id: 'convo1',
      participantIds: [USER_ID, 'user2'],
      lastUpdated: new Date('2024-01-01T10:00:00Z').toISOString(),
    };
    const convo2 = {
      id: 'convo2',
      participantIds: [USER_ID, 'user3'],
      lastUpdated: new Date('2024-01-05T12:00:00Z').toISOString(),
    };
    await setDoc(doc(db, 'conversations', 'convo1'), convo1);
    await setDoc(doc(db, 'conversations', 'convo2'), convo2);

    // Paso 2: Act
    const conversationsRef = collection(db, 'conversations');
    const complexQuery = query(
      conversationsRef,
      where('participantIds', 'array-contains', USER_ID),
      orderBy('lastUpdated', 'desc')
    );

    // Paso 3: Assert
    // Verificación 1: La consulta debe ejecutarse con éxito.
    const querySnapshotPromise = getDocs(complexQuery);
    await assertSucceeds(querySnapshotPromise);

    const querySnapshot = await querySnapshotPromise;

    // Verificación 2: Debe devolver el número correcto de documentos.
    expect(querySnapshot.docs).toHaveLength(2);

    // Verificación 3: Los resultados deben estar en el orden correcto (descendente).
    const ids = querySnapshot.docs.map(d => d.id);
    expect(ids[0]).toBe('convo2'); // La más reciente primero
    expect(ids[1]).toBe('convo1'); // La más antigua después
  });
});
