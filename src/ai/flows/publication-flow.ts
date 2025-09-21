'use server';

/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { GalleryImage, User, GalleryImageComment } from '@/lib/types';
import { CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput } from '@/lib/types';


export async function createPublicationFlow(input: CreatePublicationInput): Promise<GalleryImage> {
    const db = getFirestore();
    
    const userRef = db.collection('users').doc(input.providerId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new Error('User not found.');
    }
    
    const publicationId = `pub-${'${Date.now()}'}`;

    const newPublication: GalleryImage = {
      id: publicationId,
      providerId: input.providerId,
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
    const userRef = db.collection('users').doc(input.providerId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new Error('User not found.');
    }
    
    const productId = `prod-${'${Date.now()}'}`;
    
    const newProductPublication: GalleryImage = {
        id: productId,
        providerId: input.providerId,
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
