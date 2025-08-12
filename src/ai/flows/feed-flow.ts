
'use server';
/**
 * @fileOverview A flow for fetching the main feed content securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, limit, startAfter, doc, getDoc, orderBy } from 'firebase/firestore';
import type { GalleryImage, PublicationOwner } from '@/lib/types';
import { GetFeedInputSchema, GetFeedOutputSchema } from '@/lib/types';

export const getFeed = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: GetFeedInputSchema,
        outputSchema: GetFeedOutputSchema,
    },
    async ({ limitNum = 10, startAfterDocId }) => {
        const db = getFirestoreDb();
        const publicationsCollection = collection(db, "publications");

        // --- FORENSIC FIX ---
        // The previous complex query with multiple 'where' clauses was causing index-related errors.
        // The most robust solution is to perform the simplest possible query:
        // just order by creation date and paginate. All other filtering (by category, etc.)
        // will be handled efficiently on the client-side. This eliminates the need for
        // complex composite indexes and makes the data fetching much more reliable.

        const queryConstraints: any[] = [
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDocSnap = await getDoc(doc(db, "publications", startAfterDocId));
            if (startAfterDocSnap.exists()) {
                queryConstraints.push(start(startAfterDocSnap));
            }
        }
        
        const publicationsQuery = query(publicationsCollection, ...queryConstraints);

        const querySnapshot = await getDocs(publicationsQuery);
        if (querySnapshot.empty) {
            return { publications: [], lastVisibleDocId: undefined };
        }
        
        const publications = querySnapshot.docs.map(doc => doc.data() as GalleryImage);
            
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return {
            publications,
            lastVisibleDocId: lastVisibleDoc?.id,
        };
    }
);
