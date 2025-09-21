
'use server';

/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 * This file handles the direct interaction with the Firestore database for all publication-related write operations.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { User, GalleryImage, GalleryImageComment, CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput } from '@/lib/types';

/**
 * Creates a new publication (image or video) in the 'publications' collection.
 * @param input - The data for the new publication.
 * @returns The newly created GalleryImage object.
 * @throws Will throw an error if the user is not found.
 */
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
    
    return newPublication;
}

/**
 * Creates a new product, which is a special type of publication.
 * @param input - The data for the new product.
 * @returns The newly created product as a GalleryImage object.
 * @throws Will throw an error if the user is not found.
 */
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
          price: input.price || 0,
          category: (userSnap.data() as User).profileSetupData?.primaryCategory || 'General',
        },
    };
    
    const productRef = db.collection('publications').doc(productId);
    await productRef.set(newProductPublication);
    
    return newProductPublication;
}

/**
 * Adds a comment to a specific publication.
 * @param input - The comment data and publication ID.
 */
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

/**
 * Removes a comment from a publication, with authorization checks.
 * @param input - The data required to identify and authorize the comment removal.
 * @throws Will throw an error if the image is not found, comment is not found, or user is not authorized.
 */
export async function removeCommentFromImageFlow(input: RemoveCommentInput) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(input.imageId);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) throw new Error("Image not found.");
    
    const publication = imageSnap.data() as GalleryImage;
    const commentToRemove = publication.comments?.[input.commentIndex];

    if (!commentToRemove) throw new Error("Comment not found at the specified index.");
    
    const publicationOwnerId = publication.providerId;
    if (input.authorId !== commentToRemove.authorId && input.authorId !== publicationOwnerId) {
        throw new Error("You are not authorized to delete this comment.");
    }
    
    const updatedComments = publication.comments?.filter((_, index) => index !== input.commentIndex);

    await imageRef.update({ comments: updatedComments });
}

/**
 * Updates the description or image source of a gallery image.
 * @param input - The ID of the image and the updates to apply.
 */
export async function updateGalleryImageFlow(input: UpdateGalleryImageInput) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(input.imageId);
    
    const dataToUpdate: Record<string, any> = {};
    if (input.updates.description) dataToUpdate.description = input.updates.description;
    if (input.updates.imageDataUri) dataToUpdate.src = input.updates.imageDataUri;
    
    await imageRef.update(dataToUpdate);
}

/**
 * Deletes a publication from the 'publications' collection.
 * @param input - The ID of the image to remove.
 */
export async function removeGalleryImageFlow(input: RemoveGalleryImageInput) {
    const db = getFirestore();
    await db.collection('publications').doc(input.imageId).delete();
}
