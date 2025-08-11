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

        // CRITICAL FIX: The orderBy clause is removed to prevent complex query errors.
        // Sorting will be handled client-side or in backend logic after fetching.
        const q: any[] = [
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
        
        // Sorting is now handled in the backend code after fetching.
        const publications = querySnapshot.docs
            .map(doc => doc.data() as GalleryImage)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return {
            publications,
            lastVisibleDocId: lastVisibleDoc?.id,
        };
    }
);
