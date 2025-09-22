
'use server';

import { searchPublicationsFlow } from '@/ai/flows/search-flow';
import type { GetFeedInput } from '@/lib/types';
import { getFirebaseFirestore } from '../firebase-admin';

/**
 * Server Action to securely perform a search for publications.
 * It calls the underlying flow, ensuring a clean separation between client and server logic.
 */
export async function searchPublications(input: GetFeedInput) {
    const db = getFirebaseFirestore();
    return await searchPublicationsFlow(db, input);
}
