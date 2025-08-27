'use server';

import '@/ai/genkit';
import type { CreatePublicationInput, CreateProductInput, User } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { createProductFlow, createPublicationFlow, addCommentToImageFlow, removeCommentFromImageFlow, updateGalleryImageFlow, removeGalleryImageFlow } from '@/ai/flows/publication-flow';
import { sendNewContentNotificationFlow } from '@/ai/flows/notification-flow';


export async function createPublication(input: CreatePublicationInput) {
    const newPublication = await createPublicationFlow(input);
    
    // Asynchronously send notification without blocking the response
    if (newPublication) {
        const db = getFirestore();
        const userSnap = await db.collection('users').doc(input.userId).get();
        if (userSnap.exists()) {
            const user = userSnap.data() as User;
            if (user.verified || (user.reputation || 0) > 4.0) {
                 sendNewContentNotificationFlow({
                    providerId: input.userId,
                    publicationId: newPublication.id,
                    publicationDescription: newPublication.description,
                    providerName: user.name,
                });
            }
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.userId}`);
    return newPublication;
}

export async function createProduct(input: CreateProductInput) {
    const newProduct = await createProductFlow(input);

    if (newProduct) {
        const db = getFirestore();
        const userSnap = await db.collection('users').doc(input.userId).get();
        if (userSnap.exists()) {
            const user = userSnap.data() as User;
            if (user.verified || (user.reputation || 0) > 4.0) {
                 sendNewContentNotificationFlow({
                    providerId: input.userId,
                    publicationId: newProduct.id,
                    publicationDescription: `¡Nuevo producto disponible! ${newProduct.alt}`,
                    providerName: user.name,
                });
            }
        }
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${input.userId}`);
    return newProduct;
}

export async function addCommentToImage(input: {ownerId: string, imageId: string, commentText: string, author: {id: string, name: string, profileImage: string}}) {
    await addCommentToImageFlow({imageId: input.imageId, commentText: input.commentText, author: input.author});
    revalidatePath(`/companies/${input.ownerId}`);
}

export async function removeCommentFromImage(input: {ownerId: string, imageId: string, commentIndex: number}) {
    await removeCommentFromImageFlow({imageId: input.imageId, commentIndex: input.commentIndex});
    revalidatePath(`/companies/${input.ownerId}`);
}

export async function updateGalleryImage(input: {ownerId: string, imageId: string, updates: { description?: string, imageDataUri?: string }}) {
    await updateGalleryImageFlow({imageId: input.imageId, updates: input.updates});
    revalidatePath(`/companies/${input.ownerId}`);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    await removeGalleryImageFlow({imageId: imageId});
    revalidatePath(`/companies/${ownerId}`);
}
