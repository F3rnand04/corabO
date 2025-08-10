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

// --- Create Publication Flow ---

const CreatePublicationInputSchema = z.object({
  userId: z.string(),
  description: z.string(),
  imageDataUri: z.string(),
  aspectRatio: z.enum(['square', 'horizontal', 'vertical']),
  type: z.enum(['image', 'video']),
});
export type CreatePublicationInput = z.infer<typeof CreatePublicationInputSchema>;

export const createPublication = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: CreatePublicationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, description, imageDataUri, aspectRatio, type }) => {
    const db = getFirestoreDb();
    const batch = writeBatch(db);

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    const user = userSnap.data() as User;

    const publicationId = `pub-${Date.now()}`;

    // 1. Create the private gallery item
    const galleryItem: GalleryImage = {
      id: publicationId,
      providerId: userId,
      type: type,
      src: imageDataUri, // In a real scenario, this would be a GCS URL after upload
      alt: description.slice(0, 50),
      description,
      createdAt: new Date().toISOString(),
      comments: [],
      aspectRatio,
      likes: 0,
    };
    const userGalleryRef = doc(db, 'users', userId, 'gallery', publicationId);
    batch.set(userGalleryRef, galleryItem);

    // 2. Create the denormalized public publication for the feed
    // This is the critical fix: ensuring all required owner data is populated.
    const ownerData: PublicationOwner = {
      id: user.id,
      name: user.profileSetupData?.useUsername ? user.profileSetupData.username || user.name : user.name,
      profileImage: user.profileImage,
      verified: user.verified || false,
      isGpsActive: user.isGpsActive || false,
      reputation: user.reputation || 0,
      profileSetupData: {
        specialty: user.profileSetupData?.specialty || '',
        providerType: user.profileSetupData?.providerType || 'professional',
      },
    };

    const publicPublication: GalleryImage = {
      ...galleryItem,
      owner: ownerData,
    };
    const publicationRef = doc(db, 'publications', publicationId);
    batch.set(publicationRef, publicPublication);
    
    await batch.commit();
  }
);


// --- Create Product Flow ---

const CreateProductInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageDataUri: z.string(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;


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
            throw new Error('User not found');
        }
        const user = userSnap.data() as User;
        
        const productId = `prod-${Date.now()}`;
        const newProduct: Product = {
            id: productId,
            name,
            description,
            price,
            category: user.profileSetupData?.primaryCategory || 'General',
            providerId: userId,
            imageUrl: imageDataUri, // Again, this would be a GCS URL in production
        };
        
        const productRef = doc(db, 'products', productId);
        await setDoc(productRef, newProduct);
    }
);
