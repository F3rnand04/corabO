'use server';
/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { CreatePublicationInputSchema, CreateProductInputSchema, GalleryImageSchema } from '@/lib/types';
import type { GalleryImage, User, GalleryImageComment, CreatePublicationInput, CreateProductInput } from '@/lib/types';


const AddCommentInputSchema = z.object({
  imageId: z.string(),
  commentText: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    profileImage: z.string(),
  })
});
type AddCommentInput = z.infer<typeof AddCommentInputSchema>;


const RemoveCommentInputSchema = z.object({
  imageId: z.string(),
  commentIndex: z.number(),
});
type RemoveCommentInput = z.infer<typeof RemoveCommentInputSchema>;

const UpdateGalleryImageInputSchema = z.object({
  imageId: z.string(),
  updates: z.object({
    description: z.string().optional(),
    imageDataUri: z.string().optional(),
  })
});
type UpdateGalleryImageInput = z.infer<typeof UpdateGalleryImageInputSchema>;


const RemoveGalleryImageInputSchema = z.object({
  imageId: z.string()
});
type RemoveGalleryImageInput = z.infer<typeof RemoveGalleryImageInputSchema>;


export const createPublicationFlow = ai.defineFlow(
  {
    name: 'createPublicationFlow',
    inputSchema: CreatePublicationInputSchema,
    outputSchema: GalleryImageSchema,
  },
  async (input: CreatePublicationInput) => {
    const db = getFirestore();
    
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }
    
    const publicationId = `pub-${Date.now()}`;

    const newPublication: GalleryImage = {
      id: publicationId,
      providerId: input.userId,
      type: input.type,
      src: input.imageDataUri,
      alt: input.description.slice(0, 50),
      description: input.description,
      createdAt: new Date().toISOString(),
      comments: [],
      likes: 0,
      aspectRatio: input.aspectRatio,
    };
    
    const publicationRef = db.collection('publications').doc(publicationId);
    await publicationRef.set(newPublication);
    
    // Return the full publication object so the action layer can decide what to do next (e.g., notify).
    return newPublication;
  }
);

export const createProductFlow = ai.defineFlow(
    {
        name: 'createProductFlow',
        inputSchema: CreateProductInputSchema,
        outputSchema: GalleryImageSchema,
    },
    async (input: CreateProductInput) => {
        const db = getFirestore();
        const userRef = db.collection('users').doc(input.userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        
        const productId = `prod-${Date.now()}`;
        
        const newProductPublication: GalleryImage = {
            id: productId,
            providerId: input.userId,
            type: 'product',
            src: input.imageDataUri,
            alt: input.name,
            description: input.description,
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: [],
            productDetails: {
              name: input.name,
              price: input.price,
              category: (userSnap.data() as User).profileSetupData?.primaryCategory || 'General',
            },
        };
        
        const productRef = db.collection('publications').doc(productId);
        await productRef.set(newProductPublication);
        
        return newProductPublication;
    }
);

export const addCommentToImageFlow = ai.defineFlow(
    {
        name: 'addCommentToImageFlow',
        inputSchema: AddCommentInputSchema,
        outputSchema: z.void(),
    },
    async (input: AddCommentInput) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(input.imageId);
        
        const newComment: GalleryImageComment = {
            author: input.author.name,
            text: input.commentText,
            profileImage: input.author.profileImage,
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
    async (input: RemoveCommentInput) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(input.imageId);
        const imageSnap = await imageRef.get();

        if (!imageSnap.exists()) throw new Error("Image not found.");
        
        const publication = imageSnap.data() as GalleryImage;
        const updatedComments = publication.comments?.filter((_, index) => index !== input.commentIndex);

        await imageRef.update({ comments: updatedComments });
    }
);


export const updateGalleryImageFlow = ai.defineFlow(
    {
        name: 'updateGalleryImageFlow',
        inputSchema: UpdateGalleryImageInputSchema,
        outputSchema: z.void(),
    },
    async (input: UpdateGalleryImageInput) => {
        const db = getFirestore();
        const imageRef = db.collection('publications').doc(input.imageId);
        
        const dataToUpdate: Record<string, any> = {};
        if (input.updates.description) dataToUpdate.description = input.updates.description;
        if (input.updates.imageDataUri) dataToUpdate.src = input.updates.imageDataUri;
        
        await imageRef.update(dataToUpdate);
    }
);


export const removeGalleryImageFlow = ai.defineFlow(
    {
        name: 'removeGalleryImageFlow',
        inputSchema: RemoveGalleryImageInputSchema,
        outputSchema: z.void(),
    },
    async (input: RemoveGalleryImageInput) => {
        const db = getFirestore();
        await db.collection('publications').doc(input.imageId).delete();
    }
);
