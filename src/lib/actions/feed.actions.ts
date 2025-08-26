
'use server';

// The getFirebaseAdmin() call is removed. The action now relies on the
// globally initialized Firebase instance managed by Genkit.
import { getFeedFlow } from '@/ai/flows/feed-flow';
import { getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/profile-flow';
import { GetFeedInputSchema, GetProfileGalleryInputSchema, GetProfileProductsInputSchema } from '@/lib/types';
import { z } from 'zod';

export async function getFeed(input: z.infer<typeof GetFeedInputSchema>) {
    return await getFeedFlow(input);
}

export async function getPublicProfile(userId: string) {
    return await getPublicProfileFlow({ userId });
}

export async function getProfileGallery(input: z.infer<typeof GetProfileGalleryInputSchema>) {
   return await getProfileGalleryFlow(input);
}


export async function getProfileProducts(input: z.infer<typeof GetProfileProductsInputSchema>) {
    return await getProfileProductsFlow(input);
}
