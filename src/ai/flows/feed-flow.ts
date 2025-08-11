'use server';
/**
 * @fileOverview A flow for fetching the main feed content securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import type { GalleryImage } from '@/lib/types';
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

        let publicationsQuery;
        if (startAfterDocId) {
            const startAfterDocSnap = await getDoc(doc(db, "publications", startAfterDocId));
            if (!startAfterDocSnap.exists()) {
                return { publications: [], lastVisibleDocId: undefined };
            }
            publicationsQuery = query(
                publicationsCollection,
                startAfter(startAfterDocSnap),
                limit(limitNum)
            );
        } else {
            publicationsQuery = query(
                publicationsCollection,
                limit(limitNum)
            );
        }

        const querySnapshot = await getDocs(publicationsQuery);
        if (querySnapshot.empty) {
            return { publications: [], lastVisibleDocId: undefined };
        }
        
        const publications = querySnapshot.docs.map(doc => doc.data()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as GalleryImage[]
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return {
            publications,
            lastVisibleDocId: lastVisibleDoc?.id,
        };
    }
);
