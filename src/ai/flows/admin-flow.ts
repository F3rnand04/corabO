'use server';
/**
 * @fileOverview Flows for administrator-specific actions.
 */
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase-admin';

interface CreateManagementUserInput {
    name: string;
    lastName: string;
    email: string;
    idNumber: string;
    password?: string; // Password is required by Firebase Auth, but might be optional in some flows
    role: 'payment_verifier' | 'document_verifier' | 'dispute_manager' | 'affiliation_manager' | 'quality_auditor' | 'customer_support' | 'accountant';
    country: string;
}

/**
 * Creates a new user with a specific management role in Firebase Authentication and Firestore.
 */
export async function createManagementUserFlow(input: CreateManagementUserInput): Promise<{ uid: string }> {
    const auth = getFirebaseAuth();
    
    // Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: `${input.name} ${input.lastName}`,
        disabled: false
    });
    
    const db = getFirebaseFirestore();
    const userRef = db.collection('users').doc(userRecord.uid);
    
    // Create the user profile in Firestore
    await userRef.set({
        id: userRecord.uid,
        name: input.name,
        lastName: input.lastName,
        idNumber: input.idNumber,
        email: input.email,
        country: input.country,
        type: 'provider', // Management users might need provider-like access
        role: 'manager',
        managementRole: input.role,
        isInitialSetupComplete: true,
        isTransactionsActive: true,
        createdAt: new Date().toISOString(),
        profileImage: `https://i.postimg.cc/SNqD5pqW/avatar-placeholder.png`,
        reputation: 5,
        effectiveness: 100,
        emailValidated: true,
        phoneValidated: true,
        isGpsActive: false,
    });

    // Set custom claim for rules
    await auth.setCustomUserClaims(userRecord.uid, { role: 'manager' }); 

    return { uid: userRecord.uid };
}
