/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */
import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure initialized

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { GalleryImage, Product, User, ProfileSetupData, FirebaseUserInput } from '@/lib/types';
import { z } from 'zod';


// --- Update User Flow ---
export async function updateUserFlow(input: { userId: string, updates: any }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.update(input.updates);
}

// --- Toggle GPS Flow ---
export async function toggleGpsFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        const currentStatus = (userSnap.data() as User).isGpsActive;
        await userRef.update({ isGpsActive: !currentStatus });
    }
}


// --- Delete User Flow ---
export async function deleteUserFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.delete();
}

// --- Check ID Uniqueness Flow ---
export async function checkIdUniquenessFlow(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
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

// --- Get Public Profile Flow ---
export async function getPublicProfileFlow(input: { userId: string }): Promise<Partial<User> | null> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
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
