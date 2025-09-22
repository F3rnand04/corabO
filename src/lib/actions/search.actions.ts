'use server';

import { searchPublicationsFlow } from '@/ai/flows/search-flow';
import type { z } from 'zod';

const GetFeedInputSchema = z.object({
  limitNum: z.number().optional(),
  startAfterDocId: z.string().optional(),
  searchQuery: z.string().optional(),
  categoryFilter: z.string().optional(),
});

/**
 * Server Action to securely perform a search for publications.
 * It calls the underlying flow, ensuring a clean separation between client and server logic.
 */
export async function searchPublications(input: z.infer<typeof GetFeedInputSchema>) {
    return await searchPublicationsFlow(input);
}

