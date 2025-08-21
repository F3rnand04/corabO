
'use server';
/**
 * @fileOverview A feed generation flow for fetching publications.
 *
 * - getFeedFlow - A function that fetches publications with pagination.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, getDoc } from 'firebase/firestore';
import type { GalleryImage } from '@/lib/types';
import { GetFeedInputSchema, GetFeedOutputSchema } from '@/lib/types';

export const getFeedFlow = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: GetFeedInputSchema,
        outputSchema: GetFeedOutputSchema,
    },
    async ({ limitNum = 10, startAfterDocId }) => {
        const db = await getFirestoreDb();
        const publicationsCollection = collection(db, 'publications');
        
        const queryConstraints: any[] = [
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            } else {
                console.warn(`Cursor document with ID ${startAfterDocId} not found. Fetching from the beginning.`);
            }
        }
        
        const q = query(publicationsCollection, ...queryConstraints);
        const snapshot = await getDocs(q);
        
        const publications = snapshot.docs.map(doc => doc.data() as GalleryImage);

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDoc?.id : null;

        return { 
            publications: publications, 
            lastVisibleDocId: nextCursor
        };
    }
);
