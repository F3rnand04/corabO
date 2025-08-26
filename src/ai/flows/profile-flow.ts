
'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema, credicoraCompanyLevels, credicoraLevels } from '@/lib/types';
import type { GalleryImage, Product, User, ProfileSetupData } from '@/lib/types';
import { z } from 'zod';


// --- Update User Flow ---
const UpdateUserInputSchema = z.object({
    userId: z.string(),
    updates: z.any(), // Using z.any() for flexibility as updates can be of any shape
});

export const updateUserFlow = ai.defineFlow(
    {
        name: 'updateUserFlow',
        inputSchema: UpdateUserInputSchema,
        outputSchema: z.void(),
    },
    async ({ userId, updates }) => {
        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);
        await userRef.update(updates);
    }
);

// --- Toggle GPS Flow ---
const ToggleGpsInputSchema = z.object({
    userId: z.string(),
});

export const toggleGpsFlow = ai.defineFlow(
    {
        name: 'toggleGpsFlow',
        inputSchema: ToggleGpsInputSchema,
        outputSchema: z.void(),
    },
    async ({ userId }) => {
        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (userSnap.exists()) {
            const currentStatus = userSnap.data()?.isGpsActive || false;
            await userRef.update({ isGpsActive: !currentStatus });
        }
    }
);


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
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    await userRef.delete();
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
    const db = getFirestore();
    const usersRef = db.collection('users');
    const q = usersRef.where("idNumber", "==", idNumber).where("country", "==", country);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      return true; // ID is unique
    }

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

const UserOutputSchema = z.custom<User | null>();

export const completeInitialSetupFlow = ai.defineFlow(
  {
    name: 'completeInitialSetupFlow',
    inputSchema: CompleteInitialSetupInputSchema,
    outputSchema: UserOutputSchema, 
  },
  async ({ userId, name, lastName, idNumber, birthDate, country, type, providerType }) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    const userSnap = await userRef.get();
    if (!userSnap.exists()) {
      throw new Error("User not found during setup completion.");
    }
    
    const existingData = userSnap.data() as User;
    
    const isCompany = providerType === 'company';
    const activeCredicoraLevels = isCompany ? credicoraCompanyLevels : credicoraLevels;
    const initialCredicoraLevel = activeCredicoraLevels['1'];

    const dataToUpdate: Partial<User> = {
      name,
      lastName,
      idNumber,
      birthDate,
      country,
      isInitialSetupComplete: true,
      type: isCompany ? 'provider' : type,
      credicoraLevel: initialCredicoraLevel.level,
      credicoraLimit: initialCredicoraLevel.creditLimit,
      credicoraDetails: initialCredicoraLevel,
      profileSetupData: {
        ...(existingData.profileSetupData || {}),
        providerType: providerType,
      }
    };

    await userRef.update(dataToUpdate);

    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data() as User;
  }
);

// --- Get Public Profile Flow ---
const GetPublicProfileInputSchema = z.object({
  userId: z.string(),
});

const PublicUserOutputSchema = z.custom<Partial<User> | null>();

export const getPublicProfileFlow = ai.defineFlow(
  {
    name: 'getPublicProfileFlow',
    inputSchema: GetPublicProfileInputSchema,
    outputSchema: PublicUserOutputSchema,
  },
  async ({ userId }) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
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
);


// --- Get Gallery with Pagination ---

export const getProfileGalleryFlow = ai.defineFlow(
    {
        name: 'getProfileGalleryFlow',
        inputSchema: GetProfileGalleryInputSchema,
        outputSchema: GetProfileGalleryOutputSchema,
    },
    async ({ userId, limitNum = 9, startAfterDocId }) => {
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
);


// --- Get Products with Pagination ---

export const getProfileProductsFlow = ai.defineFlow(
    {
        name: 'getProfileProductsFlow',
        inputSchema: GetProfileProductsInputSchema,
        outputSchema: GetProfileProductsOutputSchema,
    },
    async ({ userId, limitNum = 10, startAfterDocId }) => {
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
);
