'use server';

/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 * This file handles the direct interaction with the Firestore database for all publication-related write operations.
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { User, GalleryImage, GalleryImageComment, CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput } from '@/lib/types';
// DO NOT import notification flows here to prevent circular dependencies. Orchestration happens in the action layer.

/**
 * Creates a new publication (image or video) in the 'publications' collection.
 * @param db - The Firestore database instance.
 * @param input - The data for the new publication.
 * @returns The newly created GalleryImage object.
 * @throws Will throw an error if the user is not found.
 */
export async function createPublicationFlow(db: Firestore, input: CreatePublicationInput): Promise<GalleryImage> {
    
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new Error('User not found.');
    }
    const user = userSnap.data() as User;
    
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
      owner: { // Embed owner data for performance
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
        verified: user.verified,
        isGpsActive: user.isGpsActive,
        reputation: user.reputation,
        profileSetupData: {
          specialty: user.profileSetupData?.specialty,
          providerType: user.profileSetupData?.providerType,
          username: user.profileSetupData?.username,
          primaryCategory: user.profileSetupData?.primaryCategory,
        },
        activeAffiliation: user.activeAffiliation || null,
      },
    };
    
    const publicationRef = db.collection('publications').doc(publicationId);
    await publicationRef.set(newPublication);
    
    return newPublication;
}

/**
 * Creates a new product, which is a special type of publication.
 * @param db - The Firestore database instance.
 * @param input - The data for the new product.
 * @returns The newly created product as a GalleryImage object.
 * @throws Will throw an error if the user is not found.
 */
export async function createProductFlow(db: Firestore, input: CreateProductInput): Promise<GalleryImage> {
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new Error('User not found.');
    }
    const user = userSnap.data() as User;
    
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
          category: user.profileSetupData?.primaryCategory || 'General',
        },
        owner: { // Embed owner data for performance
          id: user.id,
          name: user.name,
          profileImage: user.profileImage,
          verified: user.verified,
          isGpsActive: user.isGpsActive,
          reputation: user.reputation,
          profileSetupData: {
            specialty: user.profileSetupData?.specialty,
            providerType: user.profileSetupData?.providerType,
            username: user.profileSetupData?.username,
            primaryCategory: user.profileSetupData?.primaryCategory,
          },
          activeAffiliation: user.activeAffiliation || null,
        },
    };
    
    const productRef = db.collection('publications').doc(productId);
    await productRef.set(newProductPublication);
    
    return newProductPublication;
}

/**
 * Adds a comment to a specific publication.
 * @param db - The Firestore database instance.
 * @param input - The comment data and publication ID.
 */
export async function addCommentToImageFlow(db: Firestore, input: AddCommentInput) {
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
 * @param db - The Firestore database instance.
 * @param input - The data required to identify and authorize the comment removal.
 * @throws Will throw an error if the image is not found, comment is not found, or user is not authorized.
 */
export async function removeCommentFromImageFlow(db: Firestore, input: RemoveCommentInput) {
    const imageRef = db.collection('publications').doc(input.imageId);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) throw new Error("Image not found.");
    
    const publication = imageSnap.data() as GalleryImage;
    const commentToRemove = publication.comments?.[input.commentIndex];

    if (!commentToRemove) throw new Error("Comment not found at the specified index.");
    
    const publicationOwnerId = publication.providerId;
    // A comment can be deleted by its author or the owner of the publication
    if (input.authorId !== commentToRemove.authorId && input.authorId !== publicationOwnerId) {
        throw new Error("You are not authorized to delete this comment.");
    }
    
    const updatedComments = publication.comments?.filter((_, index) => index !== input.commentIndex);

    await imageRef.update({ comments: updatedComments });
}

/**
 * Updates the description or image source of a gallery image.
 * @param db - The Firestore database instance.
 * @param input - The ID of the image and the updates to apply.
 */
export async function updateGalleryImageFlow(db: Firestore, input: UpdateGalleryImageInput) {
    const imageRef = db.collection('publications').doc(input.imageId);
    
    const dataToUpdate: Record<string, any> = {};
    if (input.updates.description) dataToUpdate.description = input.updates.description;
    if (input.updates.imageDataUri) dataToUpdate.src = input.updates.imageDataUri;
    
    await imageRef.update(dataToUpdate);
}

/**
 * Deletes a publication from the 'publications' collection.
 * @param db - The Firestore database instance.
 * @param input - The ID of the image to remove.
 */
export async function removeGalleryImageFlow(db: Firestore, input: RemoveGalleryImageInput) {
    await db.collection('publications').doc(input.imageId).delete();
}
