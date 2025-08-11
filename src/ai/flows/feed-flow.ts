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
    async ({ limitNum = 5, startAfterDocId }) => {
        const db = getFirestoreDb();
        const publicationsCollection = collection(db, "publications");

        // The query is now simplified to order by creation date, which is a standard
        // and efficient operation supported by a default single-field index.
        const q: any[] = [
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDocSnap = await getDoc(doc(db, "publications", startAfterDocId));
            if (startAfterDocSnap.exists()) {
                q.push(startAfter(startAfterDocSnap));
            }
        }
        
        const publicationsQuery = query(publicationsCollection, ...q);

        const querySnapshot = await getDocs(publicationsQuery);
        if (querySnapshot.empty) {
            return { publications: [], lastVisibleDocId: undefined };
        }
        
        // The data is already sorted by the database query.
        const publications = querySnapshot.docs.map(doc => doc.data() as GalleryImage);
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return {
            publications,
            lastVisibleDocId: lastVisibleDoc?.id,
        };
    }
);
