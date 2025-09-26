'use server';

import { revalidatePath } from 'next/cache';
import { createProductFlow, createPublicationFlow, addCommentToImageFlow, removeCommentFromImageFlow, updateGalleryImageFlow, removeGalleryImageFlow } from '@/ai/flows/publication-flow';
import { sendNewContentNotificationFlow } from '@/ai/flows/notification-flow';
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import type { User, CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput, GalleryImage } from '@/lib/types';


/**
 * Server Action to create a new publication.
 * It orchestrates the creation flow and sends notifications for reputable providers.
 */
export async function createPublication(input: CreatePublicationInput): Promise<GalleryImage> {
    const db = getFirebaseFirestore();
    const newPublication = await createPublicationFlow(db, input);
    
    // After the publication is created, check if we should send notifications.
    // This orchestration happens here, in the action layer, not in the flow.
    const userSnap = await db.collection('users').doc(input.userId).get();
    if (userSnap.exists) {
        const user = userSnap.data() as User;
        if (user.verified || (user.reputation || 0) > 4.0) {
             sendNewContentNotificationFlow(db, {
                providerId: input.userId,
                publicationId: newPublication.id,
                publicationDescription: newPublication.description,
                providerName: user.name,
            });
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.userId}`);
    return newPublication;
}

/**
 * Server Action to create a new product.
 * It orchestrates the product creation flow and sends notifications.
 */
export async function createProduct(input: CreateProductInput) {
    const db = getFirebaseFirestore();
    const newProduct = await createProductFlow(db, input);

    // Orchestration of notification sending is done here.
    const userSnap = await db.collection('users').doc(input.userId).get();
    if (userSnap.exists) {
        const user = userSnap.data() as User;
        if (user.verified || (user.reputation || 0) > 4.0) {
             sendNewContentNotificationFlow(db, {
                providerId: input.userId,
                publicationId: newProduct.id,
                publicationDescription: `¡Nuevo producto disponible! ${newProduct.alt}`,
                providerName: user.name,
            });
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.userId}`);
    return newProduct;
}

/**
 * Server Action to add a comment to a publication.
 */
export async function addCommentToImage(input: AddCommentInput) {
    const db = getFirebaseFirestore();
    await addCommentToImageFlow(db, input);
    revalidatePath(`/publications/${input.imageId}`);
}

/**
 * Server Action to remove a comment from a publication.
 */
export async function removeCommentFromImage(input: RemoveCommentInput) {
    const db = getFirebaseFirestore();
    await removeCommentFromImageFlow(db, input);
    revalidatePath(`/publications/${input.imageId}`);
}

/**
 * Server Action to update a gallery image's details.
 */
export async function updateGalleryImage(imageId: string, updates: { description?: string, imageDataUri?: string }) {
    const db = getFirebaseFirestore();
    await updateGalleryImageFlow(db, {imageId: imageId, updates: updates});
    revalidatePath(`/publications/${imageId}`);
    revalidatePath('/profile');
}

/**
 * Server Action to remove a gallery image.
 */
export async function removeGalleryImage(ownerId: string, imageId: string) {
    const db = getFirebaseFirestore();
    await removeGalleryImageFlow(db, {imageId: imageId});
    revalidatePath(`/companies/${ownerId}`);
    revalidatePath('/profile');
}
