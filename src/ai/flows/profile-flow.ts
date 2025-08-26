/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { credicoraCompanyLevels, credicoraLevels } from '@/lib/types';
import type { GalleryImage, Product, User, ProfileSetupData, FirebaseUserInput } from '@/lib/types';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-server';

// --- Get or Create User Flow ---
// This logic has been moved to auth-flow.ts to resolve architectural issues.
// We keep the file for other profile-related flows.


// --- Update User Flow ---
export async function updateUserFlow(input: { userId: string, updates: any }) {
    getFirebaseAdmin(); // Ensure initialized
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.update(input.updates);
}

// --- Toggle GPS Flow ---
export async function toggleGpsFlow(input: { userId: string }) {
    getFirebaseAdmin(); // Ensure initialized
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (userSnap.exists()) {
        const currentStatus = (userSnap.data() as User).isGpsActive;
        await userRef.update({ isGpsActive: !currentStatus });
    }
}


// --- Delete User Flow ---
export async function deleteUserFlow(input: { userId: string }) {
    getFirebaseAdmin(); // Ensure initialized
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.delete();
}

// --- Check ID Uniqueness Flow ---
export async function checkIdUniquenessFlow(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    getFirebaseAdmin(); // Ensure initialized
    if (!input.idNumber || !input.country) {
      return true; // Don't run check if data is incomplete
    }
    const db = getFirestore();
    const usersRef = db.collection('users');
    const q = usersRef.where("idNumber", "==", input.idNumber).where("country", "==", input.country);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      return true; // ID is unique
    }

    const isOwnDocument = querySnapshot.docs[0].id === input.currentUserId;
    return isOwnDocument;
}


// --- Complete Initial Setup ---
export async function completeInitialSetupFlow(input: { userId: string, name: string, lastName: string, idNumber: string, birthDate: string, country: string, type: 'client' | 'provider' | 'repartidor', providerType: 'professional' | 'company' }): Promise<User | null> {
    getFirebaseAdmin(); // Ensure initialized
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    
    const userSnap = await userRef.get();
    if (!userSnap.exists()) {
      throw new Error("User not found during setup completion.");
    }
    
    const existingData = userSnap.data() as User;
    
    const isCompany = input.providerType === 'company';
    const activeCredicoraLevels = isCompany ? credicoraCompanyLevels : credicoraLevels;
    const initialCredicoraLevel = activeCredicoraLevels['1'];

    const dataToUpdate: Partial<User> = {
      name: input.name,
      lastName: input.lastName,
      idNumber: input.idNumber,
      birthDate: input.birthDate,
      country: input.country,
      isInitialSetupComplete: true,
      type: isCompany ? 'provider' : input.type,
      credicoraLevel: initialCredicoraLevel.level,
      credicoraLimit: initialCredicoraLevel.creditLimit,
      credicoraDetails: initialCredicoraLevel,
      profileSetupData: {
        ...(existingData.profileSetupData || {}),
        providerType: input.providerType,
      }
    };

    await userRef.update(dataToUpdate);

    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data() as User;
}

// --- Get Public Profile Flow ---
export async function getPublicProfileFlow(input: { userId: string }): Promise<Partial<User> | null> {
    getFirebaseAdmin(); // Ensure initialized
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists()) {
      return null;
    }

    const fullUser = userSnap.data() as User;

    return {
      id: fullUser.id,
      name: fullUser.name,
      lastName: fullUser.lastName,
      type: fullUser.type,
      profileImage: fullUser.profileImage,
      reputation: fullUser.reputation,
      effectiveness: fullUser.effectiveness,
      verified: fullUser.verified,
      isSubscribed: fullUser.isSubscribed,
      isGpsActive: fullUser.isGpsActive,
      isTransactionsActive: fullUser.isTransactionsActive,
      profileSetupData: fullUser.profileSetupData,
      country: fullUser.country,
      credicoraLevel: fullUser.credicoraLevel,
      credicoraLimit: fullUser.credicoraLimit,
      activeAffiliation: fullUser.activeAffiliation || null,
    };
}


// --- Get Gallery with Pagination ---
export async function getProfileGalleryFlow(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    getFirebaseAdmin(); // Ensure initialized
    const { userId, limitNum = 9, startAfterDocId } = input;
    const db = getFirestore();
    const galleryCollection = db.collection('publications');
    
    let q = galleryCollection
        .where("providerId", "==", userId)
        .where("type", "in", ["image", "video"])
        .orderBy('createdAt', 'desc')
        .limit(limitNum);

    if (startAfterDocId) {
        const startAfterDocSnap = await db.collection('publications').doc(startAfterDocId).get();
        if(startAfterDocSnap.exists) {
            q = q.startAfter(startAfterDocSnap);
        }
    }
    
    const snapshot = await q.get();

    const galleryItems = snapshot.docs.map(doc => doc.data() as GalleryImage);
    const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDocInPage?.id : undefined;

    return { 
        gallery: galleryItems, 
        lastVisibleDocId: nextCursor
    };
}


// --- Get Products with Pagination ---
export async function getProfileProductsFlow(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    getFirebaseAdmin(); // Ensure initialized
    const { userId, limitNum = 10, startAfterDocId } = input;
    const db = getFirestore();
    const publicationsCollection = db.collection('publications');
    
    let q = publicationsCollection
        .where("providerId", "==", userId)
        .where("type", "==", "product")
        .orderBy('createdAt', 'desc')
        .limit(limitNum);

    if (startAfterDocId) {
         const startAfterDocSnap = await db.collection('publications').doc(startAfterDocId).get();
        if(startAfterDocSnap.exists) {
            q = q.startAfter(startAfterDocSnap);
        }
    }

    const snapshot = await q.get();

    const userProductsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
    
    const finalProducts: Product[] = userProductsData.map(data => ({
        id: data.id,
        name: data.productDetails?.name || 'Producto sin nombre',
        description: data.description,
        price: data.productDetails?.price || 0,
        category: data.productDetails?.category || 'General',
        providerId: data.providerId,
        imageUrl: data.src,
    }));
    
    const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDocInPage?.id : undefined;


    return { 
        products: finalProducts, 
        lastVisibleDocId: nextCursor
    };
}
