'use server';

import { getFeedFlow, getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/feed-flow';

export interface GetFeedInput {
  limitNum?: number;
  startAfterDocId?: string;
  searchQuery?: string;
  categoryFilter?: string;
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

// NEW: Server action to securely fetch and enrich the main feed
export async function getFeed(input: GetFeedInput) {
    return await getFeedFlow(input);
}
