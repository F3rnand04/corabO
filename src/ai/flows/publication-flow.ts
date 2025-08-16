
'use server';
/**
 * @fileOverview Flows for creating publications and products securely on the backend.
 *
 * - createPublication - Handles creating a new gallery post.
 * - createProduct - Handles creating a new product in the catalog.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GalleryImage, User } from '@/lib/types';
import { CreatePublicationInputSchema, CreateProductInputSchema } from '@/lib/types';

// --- Create Publication Flow ---

export const createPublication = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: CreatePublicationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, description, imageDataUri, aspectRatio, type }) => {
    const db = getFirestoreDb();
    
    // Security: Validate the user exists before creating content for them.
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error('User not found. Cannot create publication for a non-existent user.');
    }
    
    const publicationId = `pub-${Date.now()}`;

    const newPublication: GalleryImage = {
      id: publicationId,
      providerId: userId,
      type: type,
      src: imageDataUri,
      alt: description.slice(0, 50),
      description,
      createdAt: new Date().toISOString(),
      comments: [],
      likes: 0,
      aspectRatio,
      // The 'owner' field is deprecated to prevent stale data.
      // It will be fetched on-demand by the client.
    };
    
    const publicationRef = doc(db, 'publications', publicationId);
    await setDoc(publicationRef, newPublication);
  }
);


// --- Create Product Flow ---

export const createProduct = ai.defineFlow(
    {
        name: 'createProductFlow',
        inputSchema: CreateProductInputSchema,
        outputSchema: z.string(), // Returns the new product ID
    },
    async ({ userId, name, description, price, imageDataUri }) => {
        const db = getFirestoreDb();
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (!userSnap.exists()) {
            throw new Error('User not found. Cannot create product for a non-existent user.');
        }
        const user = userSnap.data() as User;
        
        const productId = `prod-${Date.now()}`;
        
        const newProductPublication: GalleryImage = {
            id: productId,
            providerId: userId,
            type: 'product',
            src: imageDataUri,
            alt: name,
            description: description,
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: [],
            productDetails: {
              name: name,
              price: price,
              category: user.profileSetupData?.primaryCategory || 'General',
            },
        };
        
        const productRef = doc(db, 'publications', productId);
        await setDoc(productRef, newProductPublication);
        
        return productId;
    }
);

    