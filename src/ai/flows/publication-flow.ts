/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 */
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { GalleryImage, User, GalleryImageComment } from '@/lib/types';


// Schemas moved from types.ts for better co-location
export const CreatePublicationInputSchema = z.object({
    userId: z.string(),
    description: z.string().min(1, "La descripción no puede estar vacía."),
    imageDataUri: z.string().url("Debes proporcionar una imagen válida."),
    aspectRatio: z.enum(['square', 'horizontal', 'vertical']),
    type: z.enum(['image', 'video']),
});
export type CreatePublicationInput = z.infer<typeof CreatePublicationInputSchema>;

export const CreateProductInputSchema = z.object({
    userId: z.string(),
    name: z.string().min(3, "El nombre del producto es muy corto."),
    description: z.string().min(10, "La descripción es muy corta."),
    price: z.number().min(0.01, "El precio debe ser positivo."),
    imageDataUri: z.string().url("Debes proporcionar una imagen."),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;


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
  authorId: z.string(),
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


export async function createPublicationFlow(input: CreatePublicationInput): Promise<GalleryImage> {
    const db = getFirestore();
    
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
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


export async function createProductFlow(input: CreateProductInput): Promise<GalleryImage> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
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


export async function addCommentToImageFlow(input: AddCommentInput) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(input.imageId);
    
    const newComment: GalleryImageComment = {
        authorId: input.author.id,
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


export async function removeCommentFromImageFlow(input: RemoveCommentInput) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(input.imageId);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) throw new Error("Image not found.");
    
    const publication = imageSnap.data() as GalleryImage;
    const commentToRemove = publication.comments?.[input.commentIndex];

    if (!commentToRemove) throw new Error("Comment not found at the specified index.");
    
    // Authorization: Ensure the user is either the author of the comment or the owner of the publication
    const publicationOwnerId = publication.providerId;
    if (input.authorId !== commentToRemove.authorId && input.authorId !== publicationOwnerId) {
        throw new Error("You are not authorized to delete this comment.");
    }
    
    // Firestore does not support removing an element by index directly in a secure way.
    // The safest way is to read the array, modify it, and write it back.
    const updatedComments = publication.comments?.filter((_, index) => index !== input.commentIndex);

    await imageRef.update({ comments: updatedComments });
}


export async function updateGalleryImageFlow(input: UpdateGalleryImageInput) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(input.imageId);
    
    const dataToUpdate: Record<string, any> = {};
    if (input.updates.description) dataToUpdate.description = input.updates.description;
    if (input.updates.imageDataUri) dataToUpdate.src = input.updates.imageDataUri;
    
    await imageRef.update(dataToUpdate);
}


export async function removeGalleryImageFlow(input: RemoveGalleryImageInput) {
    const db = getFirestore();
    await db.collection('publications').doc(input.imageId).delete();
}
