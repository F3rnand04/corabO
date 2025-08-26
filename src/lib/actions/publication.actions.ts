'use server';

import { 
    createPublicationFlow, 
    createProductFlow,
    addCommentToImageFlow,
    removeCommentFromImageFlow,
    updateGalleryImageFlow,
    removeGalleryImageFlow
} from '@/ai/flows/publication-flow';
import type { CreatePublicationInput, CreateProductInput } from '@/lib/types';


export async function createPublication(input: CreatePublicationInput) {
  return await createPublicationFlow(input);
}

export async function createProduct(input: CreateProductInput) {
  return await createProductFlow(input);
}

export async function addCommentToImage(input: {ownerId: string, imageId: string, commentText: string, author: {id: string, name: string, profileImage: string}}) {
    // Note: ownerId is not used in the flow, but keeping it for potential future permission checks
    return await addCommentToImageFlow({imageId: input.imageId, commentText: input.commentText, author: input.author});
}

export async function removeCommentFromImage(input: {ownerId: string, imageId: string, commentIndex: number}) {
    // Note: ownerId is not used in the flow
    return await removeCommentFromImageFlow({imageId: input.imageId, commentIndex: input.commentIndex});
}

export async function updateGalleryImage(input: {ownerId: string, imageId: string, updates: { description?: string, imageDataUri?: string }}) {
    // Note: ownerId is not used in the flow
    return await updateGalleryImageFlow({imageId: input.imageId, updates: input.updates});
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    // Note: ownerId is not used in the flow
    return await removeGalleryImageFlow({imageId: imageId});
}
