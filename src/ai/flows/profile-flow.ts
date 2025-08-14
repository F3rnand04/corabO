

'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc, orderBy, updateDoc } from 'firebase/firestore';
import { GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';
import type { GalleryImage, Product, User } from '@/lib/types';
import { z } from 'zod';


// --- Complete Initial Setup ---
const CompleteInitialSetupInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  lastName: z.string(),
  idNumber: z.string(),
  birthDate: z.string(),
  country: z.string(),
});

export const completeInitialSetupFlow = ai.defineFlow(
  {
    name: 'completeInitialSetupFlow',
    inputSchema: CompleteInitialSetupInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, name, lastName, idNumber, birthDate, country }) => {
    const db = getFirestoreDb();
    
    // Check for duplicate ID in the same country
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("idNumber", "==", idNumber), where("country", "==", country));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Found a user with the same ID number in the same country.
      throw new Error("ID_IN_USE");
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      name,
      lastName,
      idNumber,
      birthDate,
      country,
      isInitialSetupComplete: true,
    });
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
  isGpsActive: z.boolean().optional(),
  isTransactionsActive: z.boolean().optional(),
  profileSetupData: z.any().optional(), // Using any for simplicity, can be stricter
  country: z.string().optional(),
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
      isGpsActive: fullUser.isGpsActive,
      isTransactionsActive: fullUser.isTransactionsActive,
      profileSetupData: fullUser.profileSetupData,
      country: fullUser.country,
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

        return { 
            gallery: galleryItems, 
            lastVisibleDocId: lastVisibleDocInPage?.id
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
        const productsCollection = collection(db, 'publications');
        
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

        const q = query(productsCollection, ...queryConstraints);
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

        return { 
            products: finalProducts, 
            lastVisibleDocId: lastVisibleDocInPage?.id
        };
    }
);
