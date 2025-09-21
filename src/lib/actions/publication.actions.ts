'use server';

import type { User, CreatePublicationInput, CreateProductInput, AddCommentInput, RemoveCommentInput, UpdateGalleryImageInput, RemoveGalleryImageInput } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { createProductFlow, createPublicationFlow, addCommentToImageFlow, removeCommentFromImageFlow, updateGalleryImageFlow, removeGalleryImageFlow } from '@/ai/flows/publication-flow';
import { sendNewContentNotificationFlow } from '@/ai/flows/notification-flow';


export async function createPublication(input: CreatePublicationInput) {
    const newPublication = await createPublicationFlow(input);
    
    // Asynchronously send notification without blocking the response
    if (newPublication) {
        const db = getFirestore();
        const userSnap = await db.collection('users').doc(input.providerId).get();
        if (userSnap.exists()) {
            const user = userSnap.data() as User;
            if (user.verified || (user.reputation || 0) > 4.0) {
                 sendNewContentNotificationFlow({
                    providerId: input.providerId,
                    publicationId: newPublication.id,
                    publicationDescription: newPublication.description,
                    providerName: user.name,
                });
            }
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.providerId}`);
    return newPublication;
}

export async function createProduct(input: CreateProductInput) {
    const newProduct = await createProductFlow(input);

    if (newProduct) {
        const db = getFirestore();
        const userSnap = await db.collection('users').doc(input.providerId).get();
        if (userSnap.exists()) {
            const user = userSnap.data() as User;
            if (user.verified || (user.reputation || 0) > 4.0) {
                 sendNewContentNotificationFlow({
                    providerId: input.providerId,
                    publicationId: newProduct.id,
                    publicationDescription: `¡Nuevo producto disponible! ${newProduct.alt}`,
                    providerName: user.name,
                });
            }
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.providerId}`);
    return newProduct;
}

export async function addCommentToImage(input: AddCommentInput) {
    await addCommentToImageFlow(input);
    revalidatePath(`/publications/${input.imageId}`);
}

export async function removeCommentFromImage(imageId: string, commentIndex: number) {
    // This action needs more context to be secure, like the current user's ID.
    // For now, we assume a simplified flow.
    // In a real app, you would pass the current user's ID to the flow for authorization.
    // await removeCommentFromImageFlow({ imageId, commentIndex, authorId: currentUserId });
    console.warn("removeCommentFromImage is not fully implemented with authorization.");
    revalidatePath(`/publications/${imageId}`);
}

export async function updateGalleryImage(imageId: string, updates: { description?: string, imageDataUri?: string }) {
    await updateGalleryImageFlow({imageId: imageId, updates: updates});
    revalidatePath(`/publications/${imageId}`);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    await removeGalleryImageFlow({imageId: imageId});
    revalidatePath(`/companies/${ownerId}`);
}
