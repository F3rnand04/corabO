

'use server';

import type { User, CreatePublicationInput, CreateProductInput } from '@/lib/types';
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

export async function addCommentToImage(input: {ownerId: string, imageId: string, commentText: string, author: {id: string, name: string, profileImage: string}}) {
    await addCommentToImageFlow({imageId: input.imageId, commentText: input.commentText, author: input.author});
    revalidatePath(`/companies/${input.ownerId}`);
}

export async function removeCommentFromImage(imageId: string, commentIndex: number) {
    const db = getFirestore();
    const imageRef = db.collection('publications').doc(imageId);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) throw new Error("Image not found.");
    
    const publication = imageSnap.data() as any;
    
    // Firestore does not support removing an element by index directly in a secure way.
    // The safest way is to read the array, modify it, and write it back.
    const updatedComments = publication.comments?.filter((_: any, index: number) => index !== commentIndex);

    await imageRef.update({ comments: updatedComments });
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
