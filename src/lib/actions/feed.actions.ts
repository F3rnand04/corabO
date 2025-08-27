'use server';

import '@/ai/genkit';
import { getFeedFlow } from '@/ai/flows/feed-flow';
import { getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/profile-flow';
import { GetFeedInputSchema } from '@/lib/types';
import { z } from 'zod';

export async function getFeed(input: z.infer<typeof GetFeedInputSchema>) {
    return await getFeedFlow(input);
}

export async function getPublicProfile(userId: string) {
    return await getPublicProfileFlow({ userId });
}

export async function getProfileGallery(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
   return await getProfileGalleryFlow(input);
}


export async function getProfileProducts(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    return await getProfileProductsFlow(input);
}
