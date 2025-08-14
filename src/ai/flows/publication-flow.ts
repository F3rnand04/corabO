

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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GalleryImage, PublicationOwner, User } from '@/lib/types';
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
    
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error('User not found. Cannot create publication for a non-existent user.');
    }
    const user = userSnap.data() as User;
    
    const publicationId = `pub-${Date.now()}`;

    const publicPublication: GalleryImage = {
      id: publicationId,
      providerId: userId,
      type: type,
      src: imageDataUri,
      alt: description.slice(0, 50),
      description,
      createdAt: new Date().toISOString(),
      comments: [],
      aspectRatio,
      likes: 0,
      owner: {
          id: user.id,
          name: user.profileSetupData?.useUsername ? (user.profileSetupData.username ?? user.name) : user.name,
          profileImage: user.profileImage ?? 'https://placehold.co/150x150.png',
          verified: user.verified ?? false,
          isGpsActive: user.isGpsActive ?? false,
          reputation: user.reputation ?? 0,
          profileSetupData: {
              specialty: user.profileSetupData?.specialty ?? 'Especialidad no definida',
              providerType: user.profileSetupData?.providerType ?? 'professional',
              username: user.profileSetupData?.username ?? user.name.replace(/\s+/g, '').toLowerCase(),
          },
      },
    };
    
    const publicationRef = doc(db, 'publications', publicationId);
    await setDoc(publicationRef, publicPublication);
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
            productDetails: {
              name: name,
              price: price,
              category: user.profileSetupData?.primaryCategory ?? 'General',
            },
            owner: {
              id: user.id,
              name: user.profileSetupData?.useUsername ? (user.profileSetupData.username ?? user.name) : user.name,
              profileImage: user.profileImage ?? 'https://placehold.co/150x150.png',
              verified: user.verified ?? false,
              isGpsActive: user.isGpsActive ?? false,
              reputation: user.reputation ?? 0,
              profileSetupData: {
                  specialty: user.profileSetupData?.specialty ?? 'Especialidad no definida',
                  providerType: user.profileSetupData?.providerType ?? 'professional',
                  username: user.profileSetupData?.username ?? user.name.replace(/\s+/g, '').toLowerCase(),
              },
            }
        };
        
        const productRef = doc(db, 'publications', productId);
        await setDoc(productRef, newProductPublication);
        
        return productId;
    }
);
