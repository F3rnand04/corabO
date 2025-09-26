'use server';

/**
 * @fileOverview Flows for creating and managing publications and products securely on the backend.
 * This file handles the direct interaction with the Firestore database and Firebase Storage.
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseStorage } from '@/lib/firebase-admin';
import type { User, GalleryImage, GalleryImageComment, CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput } from '@/lib/types';

/**
 * Decodes a Data URI, uploads it to Firebase Storage, and returns a long-lived Signed URL.
 * @param userId - The ID of the user uploading the file.
 * @param dataUri - The Data URI string of the file.
 * @param prefix - A prefix for the filename (e.g., 'pub' or 'prod').
 * @returns The signed URL for the uploaded file.
 */
async function uploadToStorage(userId: string, dataUri: string, prefix: string): Promise<string> {
    const bucket = getFirebaseStorage().bucket();
    const fileId = `${prefix}-${Date.now()}`;

    const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid imageDataUri format');
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const filePath = `uploads/${userId}/${fileId}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
        metadata: { contentType },
    });

    // Create a signed URL that is valid for a very long time.
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Set a far-future expiration date
    });

    return signedUrl;
}

/**
 * Creates a new publication (image or video) in the 'publications' collection after uploading the media to Storage.
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
    
    // Upload the image data to Firebase Storage and get the URL
    const fileUrl = await uploadToStorage(input.userId, input.imageDataUri, 'pub');

    const publicationId = `pub-${Date.now()}`;

    const newPublication: GalleryImage = {
      id: publicationId,
      providerId: input.userId,
      type: input.type,
      src: fileUrl, // Use the URL from Storage, not the data URI
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
 * Creates a new product, which is a special type of publication, after uploading its image to Storage.
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
    
    // Upload the product image to Firebase Storage and get the URL
    const imageUrl = await uploadToStorage(input.userId, input.imageDataUri, 'prod');

    const productId = `prod-${Date.now()}`;
    
    const newProductPublication: GalleryImage = {
        id: productId,
        providerId: input.userId,
        type: 'product',
        src: imageUrl, // Use the URL from Storage
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
 */
export async function removeCommentFromImageFlow(db: Firestore, input: RemoveCommentInput) {
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
 * If a new imageDataUri is provided, it will be uploaded to Storage, and the old one might be deleted.
 */
export async function updateGalleryImageFlow(db: Firestore, input: UpdateGalleryImageInput) {
    const imageRef = db.collection('publications').doc(input.imageId);
    
    const dataToUpdate: Record<string, any> = {};
    if (input.updates.description) {
        dataToUpdate.description = input.updates.description;
    }
    if (input.updates.imageDataUri) {
        const imageSnap = await imageRef.get();
        if(!imageSnap.exists) throw new Error('Image to update not found');
        const userId = imageSnap.data()?.providerId;
        if(!userId) throw new Error('Could not determine file owner');

        // Note: This does not delete the old image from storage. For a production app, a cleanup mechanism would be needed.
        dataToUpdate.src = await uploadToStorage(userId, input.updates.imageDataUri, 'pub-update');
    }
    
    if (Object.keys(dataToUpdate).length > 0) {
        await imageRef.update(dataToUpdate);
    }
}

/**
 * Deletes a publication from the 'publications' collection.
 * Note: This does not delete the associated file from Firebase Storage.
 */
export async function removeGalleryImageFlow(db: Firestore, input: RemoveGalleryImageInput) {
    // For a complete solution, you would first get the document, find the file URL, parse the file path,
    // and then delete the file from Storage before deleting the document.
    await db.collection('publications').doc(input.imageId).delete();
}
