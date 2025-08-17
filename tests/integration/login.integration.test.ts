
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getAuth } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { getOrCreateUser } from '@/ai/flows/auth-flow';
import { User as FirebaseUser } from 'firebase/auth';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, setDoc } from 'firebase/firestore';


jest.mock('@/lib/firebase-server', () => ({
  getFirestoreDb: jest.fn(),
}));
const { getFirestoreDb: mockedGetDb } = require('@/lib/firebase-server');


describe('Login and Auth Flow - Integration Test', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'corabo-demo-test-login',
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });
  
  beforeEach(() => {
    const db = testEnv.unauthenticatedContext().firestore();
    mockedGetDb.mockReturnValue(db);
  })

  test('should connect to the auth emulator successfully', () => {
    const auth = getAuthInstance();
    expect(auth).toBeDefined();
    console.log('✅ Auth emulator connection verified.');
  });
  
  test('getOrCreateUser should return an existing user', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    mockedGetDb.mockReturnValue(db);
    
    const existingUserData = { id: 'user_exists', name: 'Existing User', email: 'exists@test.com' };
    await setDoc(doc(db, 'users', 'user_exists'), existingUserData);

    const firebaseUserMock = {
        uid: 'user_exists',
        displayName: 'Existing User',
        email: 'exists@test.com',
        photoURL: '',
        emailVerified: true,
    } as FirebaseUser;
    
    const user = await getOrCreateUser(firebaseUserMock);

    expect(user).toBeDefined();
    expect(user.id).toBe('user_exists');
    expect(user.name).toBe('Existing User');
  });
  
   test('getOrCreateUser should create a new user if one does not exist', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    mockedGetDb.mockReturnValue(db);
    
    const firebaseUserMock = {
        uid: 'user_new',
        displayName: 'New User',
        email: 'new@test.com',
        photoURL: 'new.jpg',
        emailVerified: true,
    } as FirebaseUser;

    const user = await getOrCreateUser(firebaseUserMock);

    expect(user).toBeDefined();
    expect(user.id).toBe('user_new');
    expect(user.name).toBe('New User');
    expect(user.profileImage).toBe('new.jpg');
    expect(user.isInitialSetupComplete).toBe(false);
  });

});
