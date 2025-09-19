
'use server';

/**
 * @fileOverview A dedicated search flow for publications.
 * This acts as a centralized "search service" for the application.
 */
import { z } from 'zod';
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import type { Query } from 'firebase-admin/firestore';
import { GetFeedInputSchema } from '@/lib/types';
import { generateKeywords } from '@/lib/utils';


const SearchPublicationsOutputSchema = z.object({
  publicationIds: z.array(z.string()),
  hasMore: z.boolean(),
  lastVisibleDocId: z.string().optional(),
});
type SearchPublicationsOutput = z.infer<typeof SearchPublicationsOutputSchema>;


export async function searchPublicationsFlow(input: z.infer<typeof GetFeedInputSchema>): Promise<SearchPublicationsOutput> {
    const db = getFirebaseFirestore();
    const publicationsCollection = db.collection('publications');
    let q: Query = publicationsCollection;
    
    const limit = input.limitNum || 10;
    
    // Handle category filter
    if (input.categoryFilter) {
        q = q.where('owner.profileSetupData.primaryCategory', '==', input.categoryFilter);
    }

    // Handle search query
    if (input.searchQuery) {
        const searchTerms = generateKeywords(input.searchQuery);
        if (searchTerms.length > 0) {
             q = q.where('searchKeywords', 'array-contains-any', searchTerms.slice(0, 10));
        }
    }
    
    q = q.orderBy('createdAt', 'desc').limit(limit);

    if (input.startAfterDocId) {
        const startAfterDoc = await db.collection('publications').doc(input.startAfterDocId).get();
        if(startAfterDoc.exists) {
            q = q.startAfter(startAfterDoc);
        } else {
            console.warn(`Cursor document with ID ${'${input.startAfterDocId}'} not found. Fetching from the beginning.`);
        }
    }
    
    const snapshot = await q.get();
    
    const publicationIds = snapshot.docs.map(doc => doc.id);
    const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const nextCursor = (snapshot.docs.length === limit && lastVisibleDoc) ? lastVisibleDoc.id : undefined;

    return { 
        publicationIds,
        hasMore: !!nextCursor,
        lastVisibleDocId: nextCursor
    };
}


/**
 * Generates an array of keywords from a given text string.
 * This is a simple implementation and can be improved with more sophisticated logic.
 * @param text The input string to generate keywords from.
 * @returns An array of unique, lowercase keywords.
 */
function generateKeywords(text: string): string[] {
    if (!text) return [];
    
    const words = text.toLowerCase().split(/\s+/);
    
    const keywords = new Set<string>();
    
    words.forEach(word => {
        if (word.length > 2) {
            for (let i = 3; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        }
    });

    return Array.from(keywords);
}
