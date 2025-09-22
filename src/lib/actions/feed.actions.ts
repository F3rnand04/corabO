'use server';

import { z } from 'zod';
import { getFeedFlow, getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/feed-flow';

const GetFeedInputSchema = z.object({
  limitNum: z.number().optional(),
  startAfterDocId: z.string().optional(),
  searchQuery: z.string().optional(),
  categoryFilter: z.string().optional(),
});

export type GetFeedInput = z.infer<typeof GetFeedInputSchema>;

export async function getPublicProfile(userId: string) {
    return await getPublicProfileFlow({ userId });
}

export async function getProfileGallery(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
   return await getProfileGalleryFlow(input);
}


export async function getProfileProducts(input: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    return await getProfileProductsFlow(input);
}

// NEW: Server action to securely fetch and enrich the main feed
export async function getFeed(input: GetFeedInput) {
    return await getFeedFlow(input);
}

