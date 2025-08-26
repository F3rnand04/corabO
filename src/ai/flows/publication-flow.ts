
'use server';
/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { GalleryImage, User, GalleryImageComment, CreatePublicationInput, CreateProductInput } from '@/lib/types';
import { sendNewPublicationNotification } from './notification-flow';


const AddCommentInputSchema = z.object({
  imageId: z.string(),
  commentText: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    profileImage: z.string(),
  })
});

const RemoveCommentInputSchema = z.object({
  imageId: z.string(),
  commentIndex: z.number(),
});

const UpdateGalleryImageInputSchema = z.object({
  imageId: z.string(),
  updates: z.object({
    description: z.string().optional(),
    imageDataUri: z.string().optional(),
  })
});

const RemoveGalleryImageInputSchema = z.object({
  imageId: z.string()
});


export const createPublicationFlow = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: z.custom<CreatePublicationInput>(),
    outputSchema: z.void(),
  },
  async ({ userId, description, imageDataUri, aspectRatio, type }) => {
    const db = getFirestore();
    
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
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
    
    const publicationRef = db.collection('publications').doc(publicationId);
    await publicationRef.set(newPublication);
    
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
        inputSchema: z.custom<CreateProductInput>(),
        outputSchema: z.string(),
    },
    async ({ userId, name, description, price, imageDataUri }) => {
        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
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
        
        const productRef = db.collection('publications').doc(productId);
        await productRef.set(newProductPublication);
        
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
        inputSchema: AddCommentInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, commentText, author }) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(imageId);
        
        const newComment: GalleryImageComment = {
            author: author.name,
            text: commentText,
            profileImage: author.profileImage,
            likes: 0,
            dislikes: 0,
        };

        await imageRef.update({
            comments: FieldValue.arrayUnion(newComment)
        });
    }
);

export const removeCommentFromImageFlow = ai.defineFlow(
    {
        name: 'removeCommentFromImageFlow',
        inputSchema: RemoveCommentInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, commentIndex }) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(imageId);
        const imageSnap = await imageRef.get();

        if (!imageSnap.exists()) throw new Error("Image not found.");
        
        const publication = imageSnap.data() as GalleryImage;
        const updatedComments = publication.comments?.filter((_, index) => index !== commentIndex);

        await imageRef.update({ comments: updatedComments });
    }
);


export const updateGalleryImageFlow = ai.defineFlow(
    {
        name: 'updateGalleryImageFlow',
        inputSchema: UpdateGalleryImageInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId, updates }) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(imageId);
        
        const dataToUpdate: Record<string, any> = {};
        if (updates.description) dataToUpdate.description = updates.description;
        if (updates.imageDataUri) dataToUpdate.src = updates.imageDataUri;
        
        await imageRef.update(dataToUpdate);
    }
);


export const removeGalleryImageFlow = ai.defineFlow(
    {
        name: 'removeGalleryImageFlow',
        inputSchema: RemoveGalleryImageInputSchema,
        outputSchema: z.void(),
    },
    async ({ imageId }) => {
        const db = getFirestore();
        await db.collection('publications').doc(imageId).delete();
    }
);
