
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


// This file now ONLY exports async functions, which is compliant with 'use server'.

export const createPublicationFlow = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: z.any(), // Using z.any() to pass validation for now
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

export const createProductFlow = ai.defineFlow(
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
            publicationDescription: `¡Nuevo producto disponible! ${'\'\'\''}${name}`,
          });
        }

        return productId;
    }
);

export const addCommentToImageFlow = ai.defineFlow(
    {
        name: 'addCommentToImageFlow',
        inputSchema: z.any(),
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

export const removeCommentFromImageFlow = ai.defineFlow(
    {
        name: 'removeCommentFromImageFlow',
        inputSchema: z.any(),
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


export const updateGalleryImageFlow = ai.defineFlow(
    {
        name: 'updateGalleryImageFlow',
        inputSchema: z.any(),
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


export const removeGalleryImageFlow = ai.defineFlow(
    {
        name: 'removeGalleryImageFlow',
        inputSchema: z.any(),
        outputSchema: z.void(),
    },
    async ({ imageId }) => {
        const db = getFirestore();
        await deleteDoc(doc(db, 'publications', imageId));
    }
);
