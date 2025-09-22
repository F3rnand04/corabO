
'use server';

import { z } from 'zod';
import { getFeedFlow, getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/feed-flow';
import { getFirebaseFirestore } from '../firebase-admin';
import { GetFeedInput } from '../types';

export async function getPublicProfile(userId: string) {
    const db = getFirebaseFirestore();
    return await getPublicProfileFlow(db, { userId });
}

export async function getProfileGallery(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
   const db = getFirebaseFirestore();
   return await getProfileGalleryFlow(db, input);
}


export async function getProfileProducts(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    const db = getFirebaseFirestore();
    return await getProfileProductsFlow(db, input);
}

// NEW: Server action to securely fetch and enrich the main feed
export async function getFeed(input: GetFeedInput) {
    const db = getFirebaseFirestore();
    return await getFeedFlow(db, input);
}
