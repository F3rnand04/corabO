
'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc, orderBy, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';
import type { GalleryImage, Product, User, ProfileSetupData } from '@/lib/types';
import { z } from 'zod';


// --- Delete User Flow ---
const DeleteUserInputSchema = z.object({
  userId: z.string(),
});

export const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId }) => {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    // Note: In a production app, this would also trigger cleanup of related data
    // (e.g., publications, transactions) for data integrity.
    await deleteDoc(userRef);
  }
);

// --- Check ID Uniqueness Flow ---
const CheckIdUniquenessInputSchema = z.object({
  idNumber: z.string(),
  country: z.string(),
  currentUserId: z.string(),
});

export const checkIdUniquenessFlow = ai.defineFlow(
  {
    name: 'checkIdUniquenessFlow',
    inputSchema: CheckIdUniquenessInputSchema,
    outputSchema: z.boolean(), // Returns true if unique, false if not
  },
  async ({ idNumber, country, currentUserId }) => {
    if (!idNumber || !country) {
      return true; // Don't run check if data is incomplete
    }
    const db = getFirestoreDb();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("idNumber", "==", idNumber), where("country", "==", country));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return true; // ID is unique
    }

    // If a document is found, check if it belongs to the current user.
    // This allows a user to re-submit their own ID without it being flagged as a duplicate.
    const isOwnDocument = querySnapshot.docs[0].id === currentUserId;
    return isOwnDocument;
  }
);


// --- Complete Initial Setup ---
const CompleteInitialSetupInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  lastName: z.string(),
  idNumber: z.string(),
  birthDate: z.string(),
  country: z.string(),
  type: z.enum(['client', 'provider', 'repartidor']),
  providerType: z.enum(['professional', 'company']),
});

// The output schema now returns the full user object to update the context immediately.
const UserOutputSchema = z.any().nullable();


export const completeInitialSetupFlow = ai.defineFlow(
  {
    name: 'completeInitialSetupFlow',
    inputSchema: CompleteInitialSetupInputSchema,
    outputSchema: UserOutputSchema, // The flow now returns the updated user
  },
  async ({ userId, name, lastName, idNumber, birthDate, country, type, providerType }) => {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User not found during setup completion.");
    }
    
    const existingData = userSnap.data() as User;

    const dataToUpdate: Partial<User> = {
      name,
      lastName,
      idNumber,
      birthDate,
      country,
      isInitialSetupComplete: true,
      type,
      profileSetupData: {
        ...(existingData.profileSetupData || {}),
        providerType: providerType,
      }
    };

    await updateDoc(userRef, dataToUpdate);

    // Return the full, updated user object so the client can update its state
    const updatedUser = { ...existingData, ...dataToUpdate };
    return JSON.parse(JSON.stringify(updatedUser));
  }
);

// --- Get Public Profile Flow ---
const GetPublicProfileInputSchema = z.object({
  userId: z.string(),
});

// Define only the public fields we want to expose
const PublicUserOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastName: z.string().optional(),
  type: z.string(),
  profileImage: z.string(),
  reputation: z.number(),
  effectiveness: z.number().optional(),
  verified: z.boolean().optional(),
  isSubscribed: z.boolean().optional(), // Added this field
  isGpsActive: z.boolean().optional(),
  isTransactionsActive: z.boolean().optional(),
  profileSetupData: z.any().optional(), // Using any for simplicity, can be stricter
  country: z.string().optional(),
  credicoraLevel: z.number().optional(),
  credicoraLimit: z.number().optional(),
  activeAffiliation: z.any().optional(), // Pass affiliation data
});

export const getPublicProfileFlow = ai.defineFlow(
  {
    name: 'getPublicProfileFlow',
    inputSchema: GetPublicProfileInputSchema,
    outputSchema: PublicUserOutputSchema.nullable(),
  },
  async ({ userId }) => {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const fullUser = userSnap.data() as User;

    // Return only the public-facing data
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
);


// --- Get Gallery with Pagination ---

export const getProfileGallery = ai.defineFlow(
    {
        name: 'getProfileGalleryFlow',
        inputSchema: GetProfileGalleryInputSchema,
        outputSchema: GetProfileGalleryOutputSchema,
    },
    async ({ userId, limitNum = 9, startAfterDocId }) => {
        const db = getFirestoreDb();
        const galleryCollection = collection(db, 'publications');
        
        const queryConstraints: any[] = [
            where("providerId", "==", userId),
            where("type", "in", ["image", "video"]),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            }
        }
        
        const q = query(galleryCollection, ...queryConstraints);
        const snapshot = await getDocs(q);

        const galleryItems = snapshot.docs.map(doc => doc.data() as GalleryImage);

        const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDocInPage?.id : undefined;


        return { 
            gallery: galleryItems, 
            lastVisibleDocId: nextCursor
        };
    }
);


// --- Get Products with Pagination ---

export const getProfileProducts = ai.defineFlow(
    {
        name: 'getProfileProductsFlow',
        inputSchema: GetProfileProductsInputSchema,
        outputSchema: GetProfileProductsOutputSchema,
    },
    async ({ userId, limitNum = 10, startAfterDocId }) => {
        const db = getFirestoreDb();
        const publicationsCollection = collection(db, 'publications');
        
        const queryConstraints: any[] = [
            where("providerId", "==", userId),
            where("type", "==", "product"),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
             const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            }
        }

        const q = query(publicationsCollection, ...queryConstraints);
        const snapshot = await getDocs(q);

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
);
