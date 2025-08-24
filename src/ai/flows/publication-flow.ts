
'use server';
/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { GalleryImage, User, GalleryImageComment, CreatePublicationInput, CreateProductInput } from '@/lib/types';
import { sendNewPublicationNotification } from './notification-flow';

// --- Schemas ---
const AddCommentInputSchema = z.object({
  ownerId: z.string(),
  imageId: z.string(),
  commentText: z.string(),
  author: z.object({
      id: z.string(),
      name: z.string(),
      profileImage: z.string(),
  })
});

const RemoveCommentInputSchema = z.object({
    ownerId: z.string(),
    imageId: z.string(),
    commentIndex: z.number(),
});

const UpdateImageInputSchema = z.object({
    ownerId: z.string(),
    imageId: z.string(),
    updates: z.object({
        description: z.string().optional(),
        imageDataUri: z.string().optional(),
    }),
});

const RemoveImageInputSchema = z.object({
    ownerId: z.string(),
    imageId: z.string(),
});


// --- Flows ---

export const createPublication = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: z.any(), // Using z.any() to avoid build errors with non-async exports
    outputSchema: z.void(),
  },
  async ({ userId, description, imageDataUri, aspectRatio, type }: CreatePublicationInput) => {
    const db = getFirestore();
    
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }
    const user = userSnap.data() as User;
    
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
    };
    
    const publicationRef = doc(db, 'publications', publicationId);
    await setDoc(publicationRef, newPublication);
    
    // Notify followers if user is reputable
    if (user.verified || (user.reputation || 0) > 4.0) {
      await sendNewPublicationNotification({
        providerId: userId,
        publicationId: publicationId,
        publicationDescription: description,
      });
    }
  }
);

export const createProduct = ai.defineFlow(
    {
        name: 'createProductFlow',
        inputSchema: z.any(),
        outputSchema: z.string(),
    },
    async ({ userId, name, description, price, imageDataUri }: CreateProductInput) => {
        const db = getFirestore();
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (!userSnap.exists()) {
            throw new Error('User not found.');
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
        
        // Notify followers if user is reputable
        if (user.verified || (user.reputation || 0) > 4.0) {
          await sendNewPublicationNotification({
            providerId: userId,
            publicationId: productId,
            publicationDescription: `¡Nuevo producto disponible! ${name}`,
          });
        }

        return productId;
    }
);

export const addCommentToImage = ai.defineFlow(
    {
        name: 'addCommentToImageFlow',
        inputSchema: AddCommentInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, commentText, author }) => {
        const db = getFirestore();
        const imageRef = doc(db, 'publications', imageId);
        
        const newComment: GalleryImageComment = {
            author: author.name,
            text: commentText,
            profileImage: author.profileImage,
            likes: 0,
            dislikes: 0,
        };

        await updateDoc(imageRef, {
            comments: FieldValue.arrayUnion(newComment)
        });
    }
);

export const removeCommentFromImage = ai.defineFlow(
    {
        name: 'removeCommentFromImageFlow',
        inputSchema: RemoveCommentInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, commentIndex }) => {
        const db = getFirestore();
        const imageRef = doc(db, 'publications', imageId);
        const imageSnap = await getDoc(imageRef);

        if (!imageSnap.exists()) throw new Error("Image not found.");
        
        const publication = imageSnap.data() as GalleryImage;
        const updatedComments = publication.comments?.filter((_, index) => index !== commentIndex);

        await updateDoc(imageRef, { comments: updatedComments });
    }
);


export const updateGalleryImage = ai.defineFlow(
    {
        name: 'updateGalleryImageFlow',
        inputSchema: UpdateImageInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, updates }) => {
        const db = getFirestore();
        const imageRef = doc(db, 'publications', imageId);
        
        const dataToUpdate: Record<string, any> = {};
        if (updates.description) dataToUpdate.description = updates.description;
        if (updates.imageDataUri) dataToUpdate.src = updates.imageDataUri;
        
        await updateDoc(imageRef, dataToUpdate);
    }
);


export const removeGalleryImage = ai.defineFlow(
    {
        name: 'removeGalleryImageFlow',
        inputSchema: RemoveImageInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId }) => {
        const db = getFirestore();
        await deleteDoc(doc(db, 'publications', imageId));
    }
);
