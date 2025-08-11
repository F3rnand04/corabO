
'use server';
/**
 * @fileOverview Flows for creating publications and products securely on the backend.
 *
 * - createPublication - Handles creating a new gallery post and its public copy.
 * - createProduct - Handles creating a new product in the catalog.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { GalleryImage, Product, User, PublicationOwner } from '@/lib/types';
import { CreatePublicationInputSchema, CreateProductInputSchema } from '@/lib/types';

// --- Create Publication Flow ---

export const createPublication = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: CreatePublicationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, description, imageDataUri, aspectRatio, type, owner }) => {
    const db = getFirestoreDb();
    const batch = writeBatch(db);

    const publicationId = `pub-${Date.now()}`;

    // Create the denormalized public publication for the feed
    const publicPublication: GalleryImage = {
      id: publicationId,
      providerId: userId,
      type: type, // 'image' or 'video'
      src: imageDataUri, 
      alt: description.slice(0, 50),
      description,
      createdAt: new Date().toISOString(),
      comments: [],
      aspectRatio,
      likes: 0,
      owner: owner, // Use the owner data passed from the client
    };
    
    const publicationRef = doc(db, 'publications', publicationId);
    batch.set(publicationRef, publicPublication);
    
    await batch.commit();
  }
);


// --- Create Product Flow ---

export const createProduct = ai.defineFlow(
    {
        name: 'createProductFlow',
        inputSchema: CreateProductInputSchema,
        outputSchema: z.void(),
    },
    async ({ userId, name, description, price, imageDataUri }) => {
        const db = getFirestoreDb();
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (!userSnap.exists()) {
            throw new Error('User not found. Cannot create product for a non-existent user.');
        }
        const user = userSnap.data() as User;
        
        const productId = `prod-${Date.now()}`;
        
        // This now creates a document in the 'publications' collection with type 'product'
        const newProductPublication: GalleryImage = {
            id: productId,
            providerId: userId,
            type: 'product',
            src: imageDataUri,
            alt: name,
            description: description,
            createdAt: new Date().toISOString(),
            // Product-specific details are now part of the GalleryImage type
            productDetails: {
              name: name,
              price: price,
              category: user.profileSetupData?.primaryCategory ?? 'General',
            },
            owner: {
              id: user.id,
              name: user.profileSetupData?.useUsername ? (user.profileSetupData.username ?? user.name) : user.name,
              profileImage: user.profileImage ?? '',
              verified: user.verified ?? false,
              isGpsActive: user.isGpsActive ?? false,
              reputation: user.reputation ?? 0,
            }
        };
        
        const productRef = doc(db, 'publications', productId);
        await setDoc(productRef, newProductPublication);
    }
);
